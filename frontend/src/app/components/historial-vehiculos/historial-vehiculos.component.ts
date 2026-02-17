import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { HistorialVehicularService } from '../../services/historial-vehicular.service';
import { 
  HistorialVehiculo, 
  FiltroHistorialVehiculo, 
  TipoCambioVehiculo,
  TipoEventoHistorial,
  ResumenHistorialVehiculo 
} from '../../models/historial-vehicular.model';

@Component({
  selector: 'app-historial-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ] as const,
  templateUrl: './historial-vehiculos.component.html',
  styleUrls: ['./historial-vehiculos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialVehiculosComponent implements OnInit {
  private historialService = inject(HistorialVehicularService);
  private snackBar = inject(MatSnackBar);

  // Signals
  historial = signal<HistorialVehiculo[]>([]);
  resumen = signal<ResumenHistorialVehiculo | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  totalElementos = signal<number>(0);
  tamanoPagina = signal<number>(25);
  paginaActual = signal<number>(0);

  // Filtros
  filtros: FiltroHistorialVehiculo = {};
  
  // Columnas de la tabla
  columnasMostradas = [
    'fechaCambio',
    'placa', 
    'tipoCambio',
    'empresas',
    'estados',
    'motivo',
    'usuario',
    'oficina',
    'acciones'
  ];

  // Tipos de cambio disponibles
  tiposCambio = Object.values(TipoEventoHistorial);

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.loading.set(true);
    this.historialService.obtenerHistorial(this.filtros).subscribe({
      next: (historial: HistorialVehiculo[]) => {
        this.historial.set(historial);
        this.totalElementos.set(historial.length);
        this.loading.set(false);
        
        // Cargar resumen si hay un vehículo específico
        if (this.filtros.vehiculoId) {
          this.cargarResumen(this.filtros.vehiculoId);
        }
      },
      error: (error: any) => {
        this.error.set(error);
        this.loading.set(false);
        this.mostrarError('Error al cargar el historial');
      }
    });
  }

  cargarResumen(vehiculoId: string): void {
    this.historialService.obtenerResumenHistorial(vehiculoId).subscribe({
      next: (resumen: ResumenHistorialVehiculo) => {
        this.resumen.set(resumen);
      },
      error: (error: any) => {
        console.error('Error al cargar resumen::', error);
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(0);
    this.cargarHistorial();
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.resumen.set(null);
    this.aplicarFiltros();
  }

  cambiarPagina(event: PageEvent): void {
    this.paginaActual.set(event.pageIndex);
    this.tamanoPagina.set(event.pageSize);
    // Implementar lógica de paginación del backend si es necesario
  }

  ordenarDatos(sort: Sort): void {
    // Implementar lógica de ordenamiento
    // console.log removed for production
  }

  verDetalles(historial: HistorialVehiculo): void {
    // Implementar modal de detalles
    // console.log removed for production
  }

  editarHistorial(historial: HistorialVehiculo): void {
    // Implementar modal de edición
    // console.log removed for production
  }

  obtenerColorTipoCambio(tipo: TipoEventoHistorial): string {
    const colores: Partial<Record<TipoEventoHistorial, string>> = {
      [TipoEventoHistorial.TRANSFERENCIA_EMPRESA]: 'accent',
      [TipoEventoHistorial.CAMBIO_ESTADO]: 'primary',
      [TipoEventoHistorial.ASIGNACION_RUTA]: 'warn',
      [TipoEventoHistorial.DESASIGNACION_RUTA]: 'warn',
      [TipoEventoHistorial.REMOCION_RUTA]: 'warn',
      [TipoEventoHistorial.CAMBIO_RESOLUCION]: 'primary',
      [TipoEventoHistorial.ACTIVACION]: 'accent',
      [TipoEventoHistorial.REACTIVACION]: 'accent',
      [TipoEventoHistorial.DESACTIVACION]: 'warn',
      [TipoEventoHistorial.SUSPENSION]: 'warn',
      [TipoEventoHistorial.RENOVACION_TUC]: 'primary',
      [TipoEventoHistorial.MODIFICACION]: 'primary',
      [TipoEventoHistorial.MODIFICACION_DATOS]: 'primary',
      [TipoEventoHistorial.INSPECCION]: 'accent',
      [TipoEventoHistorial.INSPECCION_TECNICA]: 'accent',
      [TipoEventoHistorial.MANTENIMIENTO]: 'accent',
      [TipoEventoHistorial.MULTA]: 'warn',
      [TipoEventoHistorial.SANCION]: 'warn',
      [TipoEventoHistorial.REHABILITACION]: 'accent'
    };
    
    return colores[tipo] || 'primary';
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'CERRAR', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
} 