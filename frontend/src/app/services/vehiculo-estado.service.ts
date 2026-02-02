import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { VehiculoService } from './vehiculo.service';
import { VehiculoNotificationService } from './vehiculo-notification.service';
import { EmpresaService } from './empresa.service';
import { AuthService } from './auth.service';
import { Vehiculo, VehiculoUpdate } from '../models/vehiculo.model';

/**
 * Servicio para gestionar cambios de estado de vehículos con notificaciones
 * Requirements: 9.2, 9.4
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoEstadoService {
  private vehiculoService = inject(VehiculoService);
  private vehiculoNotificationService = inject(VehiculoNotificationService);
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);

  /**
   * Cambiar estado de un vehículo y enviar notificaciones
   * Requirements: 9.2, 9.4
   * 
   * @param vehiculoId ID del vehículo
   * @param nuevoEstado Nuevo estado del vehículo
   * @param destinatariosIds IDs de usuarios a notificar
   * @returns Observable con el vehículo actualizado
   */
  cambiarEstado(
    vehiculoId: string,
    nuevoEstado: string,
    destinatariosIds: string[] = []
  ): Observable<Vehiculo> {
    // Primero obtener el vehículo actual para conocer el estado anterior
    return new Observable(observer => {
      this.vehiculoService.getVehiculo(vehiculoId).subscribe({
        next: (vehiculoActual) => {
          if (!vehiculoActual) {
            observer.error(new Error('Vehículo no encontrado'));
            return;
          }

          const estadoAnterior = vehiculoActual.estado;

          // Actualizar el estado
          const update: VehiculoUpdate = {
            estado: nuevoEstado
          };

          this.vehiculoService.updateVehiculo(vehiculoId, update).subscribe({
            next: (vehiculoActualizado) => {
              // Obtener la empresa para las notificaciones
              this.empresaService.getEmpresa(vehiculoActualizado.empresaActualId).subscribe({
                next: (empresa) => {
                  // Enviar notificaciones
                  this.vehiculoNotificationService.notificarCambioEstado(
                    vehiculoActualizado,
                    estadoAnterior,
                    nuevoEstado,
                    empresa,
                    destinatariosIds
                  );

                  // console.log removed for production
                  observer.next(vehiculoActualizado);
                  observer.complete();
                },
                error: (error) => {
                  console.error('Error obteniendo empresa para notificación::', error);
                  // Aún así devolver el vehículo actualizado
                  observer.next(vehiculoActualizado);
                  observer.complete();
                }
              });
            },
            error: (error) => {
              console.error('Error actualizando estado del vehículo::', error);
              observer.error(error);
            }
          });
        },
        error: (error) => {
          console.error('Error obteniendo vehículo actual::', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Activar un vehículo
   * Requirements: 9.2
   */
  activarVehiculo(vehiculoId: string, destinatariosIds: string[] = []): Observable<Vehiculo> {
    return this.cambiarEstado(vehiculoId, 'ACTIVO', destinatariosIds);
  }

  /**
   * Suspender un vehículo
   * Requirements: 9.2
   */
  suspenderVehiculo(vehiculoId: string, destinatariosIds: string[] = []): Observable<Vehiculo> {
    return this.cambiarEstado(vehiculoId, 'SUSPENDIDO', destinatariosIds);
  }

  /**
   * Poner un vehículo en revisión
   * Requirements: 9.2
   */
  ponerEnRevision(vehiculoId: string, destinatariosIds: string[] = []): Observable<Vehiculo> {
    return this.cambiarEstado(vehiculoId, 'EN_REVISION', destinatariosIds);
  }

  /**
   * Inactivar un vehículo
   * Requirements: 9.2
   */
  inactivarVehiculo(vehiculoId: string, destinatariosIds: string[] = []): Observable<Vehiculo> {
    return this.cambiarEstado(vehiculoId, 'INACTIVO', destinatariosIds);
  }

  /**
   * Cambiar estado en lote
   * Requirements: 9.2
   */
  cambiarEstadoLote(
    vehiculosIds: string[],
    nuevoEstado: string,
    destinatariosIds: string[] = []
  ): Observable<Vehiculo[]> {
    return new Observable(observer => {
      const vehiculosActualizados: Vehiculo[] = [];
      let procesados = 0;

      vehiculosIds.forEach(vehiculoId => {
        this.cambiarEstado(vehiculoId, nuevoEstado, destinatariosIds).subscribe({
          next: (vehiculo) => {
            vehiculosActualizados.push(vehiculo);
            procesados++;

            if (procesados === vehiculosIds.length) {
              observer.next(vehiculosActualizados);
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Error cambiando estado del vehículo ${vehiculoId}:`, error);
            procesados++;

            if (procesados === vehiculosIds.length) {
              observer.next(vehiculosActualizados);
              observer.complete();
            }
          }
        });
      });
    });
  }
}
