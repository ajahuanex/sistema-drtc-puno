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

import { HistorialVehiculoService } from '../../services/historial-vehiculo.service';
import { 
  HistorialVehiculo, 
  FiltroHistorialVehiculo, 
  TipoCambioVehiculo,
  ResumenHistorialVehiculo 
} from '../../models/historial-vehiculo.model';

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
  private historialService = inject(HistorialVehiculoService);
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
  tiposCambio = Object.values(TipoCambioVehiculo);

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
        console.error('Error al cargar resumen:', error);
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
    console.log('Ordenar por:', sort);
  }

  verDetalles(historial: HistorialVehiculo): void {
    // Implementar modal de detalles
    console.log('Ver detalles:', historial);
  }

  editarHistorial(historial: HistorialVehiculo): void {
    // Implementar modal de edición
    console.log('Editar historial:', historial);
  }

  obtenerColorTipoCambio(tipo: TipoCambioVehiculo): string {
    const colores: Record<TipoCambioVehiculo, string> = {
      [TipoCambioVehiculo.TRANSFERENCIA_EMPRESA]: 'accent',
      [TipoCambioVehiculo.CAMBIO_ESTADO]: 'primary',
      [TipoCambioVehiculo.ASIGNACION_RUTA]: 'warn',
      [TipoCambioVehiculo.REMOCION_RUTA]: 'warn',
      [TipoCambioVehiculo.CAMBIO_RESOLUCION]: 'primary',
      [TipoCambioVehiculo.ACTIVACION]: 'accent',
      [TipoCambioVehiculo.DESACTIVACION]: 'warn',
      [TipoCambioVehiculo.RENOVACION_TUC]: 'primary',
      [TipoCambioVehiculo.MODIFICACION_DATOS]: 'primary',
      [TipoCambioVehiculo.INSPECCION_TECNICA]: 'accent',
      [TipoCambioVehiculo.MANTENIMIENTO]: 'accent',
      [TipoCambioVehiculo.SANCION]: 'warn',
      [TipoCambioVehiculo.REHABILITACION]: 'accent'
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