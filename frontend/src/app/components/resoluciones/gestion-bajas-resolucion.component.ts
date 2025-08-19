import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';

import { ResolucionBajasIntegrationService } from '../../services/resolucion-bajas-integration.service';
import { BajaVehiculoService } from '../../services/baja-vehiculo.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { 
  Resolucion, 
  TipoTramite, 
  BajaVehiculoResolucion,
  FlujoSustitucionVehiculo,
  FlujoRenovacionVehiculo,
  TipoBajaResolucion
} from '../../models/resolucion.model';
import { BajaVehiculo, TipoBajaVehiculo } from '../../models/baja-vehiculo.model';
import { Vehiculo } from '../../models/vehiculo.model';

@Component({
  selector: 'app-gestion-bajas-resolucion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatTabsModule
  ],
  templateUrl: './gestion-bajas-resolucion.component.html',
  styleUrls: ['./gestion-bajas-resolucion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionBajasResolucionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
  private resolucionBajasService = inject(ResolucionBajasIntegrationService);
  private bajaVehiculoService = inject(BajaVehiculoService);
  private vehiculoService = inject(VehiculoService);

  // Input para recibir la resolución
  resolucion = signal<Resolucion | null>(null);
  
  // Estado reactivo
  isLoading = signal(false);
  bajasIntegradas = this.resolucionBajasService.bajasIntegradas;
  flujosSustitucion = this.resolucionBajasService.flujosSustitucion;
  flujosRenovacion = this.resolucionBajasService.flujosRenovacion;
  estadisticas = this.resolucionBajasService.estadisticas;

  // Columnas de las tablas
  columnasBajas = ['tipoBaja', 'vehiculo', 'fecha', 'motivo', 'estado', 'acciones'];
  columnasFlujos = ['vehiculoAnterior', 'vehiculoNuevo', 'fechaSustitucion', 'motivoSustitucion', 'accionesFlujo'];
  columnasRenovacion = ['vehiculosRenovados', 'fechaRenovacion', 'motivoRenovacion', 'cambiosRealizados', 'accionesRenovacion'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga los datos iniciales
   */
  private cargarDatos(): void {
    this.isLoading.set(true);
    
    // TODO: Implementar carga real de datos
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  /**
   * Abre el modal para crear una nueva baja
   */
  nuevaBaja(): void {
    // TODO: Implementar modal de nueva baja
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Ver detalle de una baja
   */
  verDetalleBaja(baja: BajaVehiculoResolucion): void {
    // TODO: Implementar modal de detalle
    this.snackBar.open(`Ver detalle de baja: ${baja.id}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Eliminar una baja
   */
  eliminarBaja(baja: BajaVehiculoResolucion): void {
    // TODO: Implementar confirmación y eliminación
    this.snackBar.open(`Eliminar baja: ${baja.id}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Ver detalle de un flujo de sustitución
   */
  verDetalleFlujo(flujo: FlujoSustitucionVehiculo): void {
    // TODO: Implementar modal de detalle
    this.snackBar.open(`Ver detalle de sustitución`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Ver detalle de un flujo de renovación
   */
  verDetalleRenovacion(flujo: FlujoRenovacionVehiculo): void {
    // TODO: Implementar modal de detalle
    this.snackBar.open(`Ver detalle de renovación`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Obtiene el nombre del tipo de baja
   */
  getNombreTipoBaja(tipo: TipoBajaResolucion): string {
    const nombres: { [key: string]: string } = {
      'SUSTITUCION_VEHICULO': 'Sustitución',
      'RENOVACION_VEHICULO': 'Renovación',
      'INCREMENTO_VEHICULO': 'Incremento',
      'OTROS': 'Otros'
    };
    return nombres[tipo] || tipo;
  }

  /**
   * Obtiene el nombre del vehículo
   */
  getNombreVehiculo(vehiculoId: string): string {
    // TODO: Implementar obtención real del nombre del vehículo
    return `Vehículo ${vehiculoId}`;
  }

  /**
   * Establece la resolución para este componente
   */
  setResolucion(resolucion: Resolucion): void {
    this.resolucion.set(resolucion);
    this.cargarDatos();
  }
} 