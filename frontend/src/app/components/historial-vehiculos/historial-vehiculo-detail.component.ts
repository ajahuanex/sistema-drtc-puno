import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { HistorialVehiculoService } from '../../services/historial-vehiculo.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { 
  HistorialVehiculo, 
  ResumenHistorialVehiculo 
} from '../../models/historial-vehiculo.model';
import { Vehiculo } from '../../models/vehiculo.model';

@Component({
  selector: 'app-historial-vehiculo-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="historial-detail-container">
      <!-- Header con información del vehículo -->
      <mat-card class="vehiculo-header-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>directions_car</mat-icon>
            HISTORIAL DEL VEHÍCULO {{ vehiculo()?.placa }}
          </mat-card-title>
          <mat-card-subtitle>
            {{ vehiculo()?.marca }} {{ vehiculo()?.modelo }} - {{ vehiculo()?.anioFabricacion }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-button (click)="volverAtras()">
            <mat-icon>arrow_back</mat-icon>
            VOLVER
          </button>
          <button mat-raised-button color="primary" (click)="exportarHistorial()">
            <mat-icon>download</mat-icon>
            EXPORTAR
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Resumen del historial -->
      <mat-card *ngIf="resumen()" class="resumen-card">
        <mat-card-header>
          <mat-card-title>RESUMEN DEL HISTORIAL</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="resumen-label">TOTAL CAMBIOS</span>
              <span class="resumen-value">{{ resumen()?.totalCambios }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">ÚLTIMO CAMBIO</span>
              <span class="resumen-value">{{ resumen()?.ultimoCambio | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">EMPRESA ACTUAL</span>
              <span class="resumen-value">{{ resumen()?.empresaActual }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">ESTADO ACTUAL</span>
              <span class="resumen-value">{{ resumen()?.estadoActual }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">RESOLUCIÓN ACTUAL</span>
              <span class="resumen-value">{{ resumen()?.resolucionActual }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">RUTA ACTUAL</span>
              <span class="resumen-value">{{ resumen()?.rutaActual || 'SIN ASIGNAR' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Lista del historial -->
      <mat-card class="historial-list-card">
        <mat-card-header>
          <mat-card-title>DETALLE DEL HISTORIAL</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading()" class="loading-container">
            <mat-spinner></mat-spinner>
            <p>CARGANDO HISTORIAL...</p>
          </div>

          <div *ngIf="!loading() && historial().length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>NO SE ENCONTRÓ HISTORIAL PARA ESTE VEHÍCULO</p>
          </div>

          <div *ngIf="!loading() && historial().length > 0" class="historial-timeline">
            <div *ngFor="let item of historial(); trackBy: trackByHistorial" class="timeline-item">
              <div class="timeline-marker" [class]="'marker-' + obtenerClaseTipoCambio(item.tipoCambio)">
                <mat-icon>{{ obtenerIconoTipoCambio(item.tipoCambio) }}</mat-icon>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-date">{{ item.fechaCambio | date:'dd/MM/yyyy HH:mm' }}</span>
                  <mat-chip-set>
                    <mat-chip [color]="obtenerColorTipoCambio(item.tipoCambio)" selected>
                      {{ item.tipoCambio | titlecase }}
                    </mat-chip>
                  </mat-chip-set>
                </div>
                
                <div class="timeline-body">
                  <div *ngIf="item.empresaOrigenNombre && item.empresaDestinoNombre" class="empresa-transfer">
                    <strong>TRANSFERENCIA:</strong> 
                    <span class="empresa-origen">{{ item.empresaOrigenNombre }}</span>
                    <mat-icon>arrow_forward</mat-icon>
                    <span class="empresa-destino">{{ item.empresaDestinoNombre }}</span>
                  </div>
                  
                  <div *ngIf="item.estadoAnterior && item.estadoNuevo" class="estado-cambio">
                    <strong>CAMBIO DE ESTADO:</strong> 
                    <span class="estado-anterior">{{ item.estadoAnterior }}</span>
                    <mat-icon>arrow_forward</mat-icon>
                    <span class="estado-nuevo">{{ item.estadoNuevo }}</span>
                  </div>
                  
                  <div *ngIf="item.motivo" class="motivo">
                    <strong>MOTIVO:</strong> {{ item.motivo }}
                  </div>
                  
                  <div *ngIf="item.observaciones" class="observaciones">
                    <strong>OBSERVACIONES:</strong> {{ item.observaciones }}
                  </div>
                  
                  <div class="metadata">
                    <span><strong>USUARIO:</strong> {{ item.usuarioNombre }}</span>
                    <span *ngIf="item.oficinaNombre"><strong>OFICINA:</strong> {{ item.oficinaNombre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./historial-vehiculo-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialVehiculoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private historialService = inject(HistorialVehiculoService);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);

  // Signals
  vehiculo = signal<Vehiculo | null>(null);
  historial = signal<HistorialVehiculo[]>([]);
  resumen = signal<ResumenHistorialVehiculo | null>(null);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    const vehiculoId = this.route.snapshot.paramMap.get('id');
    if (vehiculoId) {
      this.cargarVehiculo(vehiculoId);
      this.cargarHistorial(vehiculoId);
      this.cargarResumen(vehiculoId);
    }
  }

  cargarVehiculo(vehiculoId: string): void {
    this.vehiculoService.getVehiculoById(vehiculoId).subscribe({
      next: (vehiculo: Vehiculo | null) => {
        if (vehiculo) {
          this.vehiculo.set(vehiculo);
        }
      },
      error: (error: any) => {
        console.error('Error al cargar vehículo:', error);
        this.mostrarError('Error al cargar la información del vehículo');
      }
    });
  }

  cargarHistorial(vehiculoId: string): void {
    this.loading.set(true);
    this.historialService.obtenerHistorialVehiculo(vehiculoId).subscribe({
      next: (historial: HistorialVehiculo[]) => {
        this.historial.set(historial);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error al cargar historial:', error);
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

  volverAtras(): void {
    this.router.navigate(['/vehiculos']);
  }

  exportarHistorial(): void {
    // Implementar exportación del historial
    console.log('Exportar historial');
    this.mostrarMensaje('Funcionalidad de exportación en desarrollo');
  }

  trackByHistorial(index: number, item: HistorialVehiculo): string {
    return item.id;
  }

  obtenerClaseTipoCambio(tipo: string): string {
    const clases: Record<string, string> = {
      'TRANSFERENCIA_EMPRESA': 'transferencia',
      'CAMBIO_ESTADO': 'estado',
      'ASIGNACION_RUTA': 'ruta',
      'REMOCION_RUTA': 'ruta',
      'CAMBIO_RESOLUCION': 'resolucion',
      'ACTIVACION': 'activacion',
      'DESACTIVACION': 'desactivacion',
      'RENOVACION_TUC': 'tuc',
      'MODIFICACION_DATOS': 'datos',
      'INSPECCION_TECNICA': 'inspeccion',
      'MANTENIMIENTO': 'mantenimiento',
      'SANCION': 'sancion',
      'REHABILITACION': 'rehabilitacion'
    };
    
    return clases[tipo] || 'default';
  }

  obtenerIconoTipoCambio(tipo: string): string {
    const iconos: Record<string, string> = {
      'TRANSFERENCIA_EMPRESA': 'swap_horiz',
      'CAMBIO_ESTADO': 'toggle_on',
      'ASIGNACION_RUTA': 'route',
      'REMOCION_RUTA': 'route',
      'CAMBIO_RESOLUCION': 'description',
      'ACTIVACION': 'check_circle',
      'DESACTIVACION': 'cancel',
      'RENOVACION_TUC': 'refresh',
      'MODIFICACION_DATOS': 'edit',
      'INSPECCION_TECNICA': 'build',
      'MANTENIMIENTO': 'build',
      'SANCION': 'warning',
      'REHABILITACION': 'restore'
    };
    
    return iconos[tipo] || 'info';
  }

  obtenerColorTipoCambio(tipo: string): string {
    const colores: Record<string, string> = {
      'TRANSFERENCIA_EMPRESA': 'accent',
      'CAMBIO_ESTADO': 'primary',
      'ASIGNACION_RUTA': 'warn',
      'REMOCION_RUTA': 'warn',
      'CAMBIO_RESOLUCION': 'primary',
      'ACTIVACION': 'accent',
      'DESACTIVACION': 'warn',
      'RENOVACION_TUC': 'primary',
      'MODIFICACION_DATOS': 'primary',
      'INSPECCION_TECNICA': 'accent',
      'MANTENIMIENTO': 'accent',
      'SANCION': 'warn',
      'REHABILITACION': 'accent'
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

  private mostrarMensaje(mensaje: string): void {
    this.snackBar.open(mensaje, 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
} 