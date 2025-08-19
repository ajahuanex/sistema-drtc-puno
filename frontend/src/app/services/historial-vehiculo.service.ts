import { Injectable, inject, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  HistorialVehiculo, 
  HistorialVehiculoCreate, 
  HistorialVehiculoUpdate, 
  FiltroHistorialVehiculo, 
  ResumenHistorialVehiculo,
  TipoCambioVehiculo 
} from '../models/historial-vehiculo.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialVehiculoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/historial-vehiculos`;

  // Signals para el estado del historial
  private historialSubject = new BehaviorSubject<HistorialVehiculo[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Computed values
  historial = computed(() => this.historialSubject.value);
  loading = computed(() => this.loadingSubject.value);
  error = computed(() => this.errorSubject.value);

  // Obtener todo el historial con filtros
  obtenerHistorial(filtros?: FiltroHistorialVehiculo): Observable<HistorialVehiculo[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        const value = filtros[key as keyof FiltroHistorialVehiculo];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return new Observable(observer => {
      this.http.get<HistorialVehiculo[]>(this.apiUrl, { params })
        .subscribe({
          next: (historial) => {
            this.historialSubject.next(historial);
            this.loadingSubject.next(false);
            observer.next(historial);
            observer.complete();
          },
          error: (error) => {
            const errorMsg = error.error?.message || 'Error al obtener el historial';
            this.errorSubject.next(errorMsg);
            this.loadingSubject.next(false);
            observer.error(errorMsg);
          }
        });
    });
  }

  // Obtener historial de un vehículo específico
  obtenerHistorialVehiculo(vehiculoId: string): Observable<HistorialVehiculo[]> {
    return this.obtenerHistorial({ vehiculoId });
  }

  // Obtener historial por placa
  obtenerHistorialPorPlaca(placa: string): Observable<HistorialVehiculo[]> {
    return this.obtenerHistorial({ placa: placa.toUpperCase() });
  }

  // Obtener historial de una empresa
  obtenerHistorialEmpresa(empresaId: string): Observable<HistorialVehiculo[]> {
    return this.obtenerHistorial({ empresaId });
  }

  // Obtener resumen del historial
  obtenerResumenHistorial(vehiculoId: string): Observable<ResumenHistorialVehiculo> {
    return this.http.get<ResumenHistorialVehiculo>(`${this.apiUrl}/resumen/${vehiculoId}`);
  }

  // Crear nuevo registro de historial
  crearHistorial(historial: HistorialVehiculoCreate): Observable<HistorialVehiculo> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable(observer => {
      this.http.post<HistorialVehiculo>(this.apiUrl, historial)
        .subscribe({
          next: (nuevoHistorial) => {
            // Actualizar la lista local
            const historialActual = this.historialSubject.value;
            this.historialSubject.next([nuevoHistorial, ...historialActual]);
            this.loadingSubject.next(false);
            observer.next(nuevoHistorial);
            observer.complete();
          },
          error: (error) => {
            const errorMsg = error.error?.message || 'Error al crear el registro de historial';
            this.errorSubject.next(errorMsg);
            this.loadingSubject.next(false);
            observer.error(errorMsg);
          }
        });
    });
  }

  // Actualizar registro de historial
  actualizarHistorial(id: string, actualizacion: HistorialVehiculoUpdate): Observable<HistorialVehiculo> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable(observer => {
      this.http.put<HistorialVehiculo>(`${this.apiUrl}/${id}`, actualizacion)
        .subscribe({
          next: (historialActualizado) => {
            // Actualizar la lista local
            const historialActual = this.historialSubject.value;
            const historialModificado = historialActual.map(h => 
              h.id === id ? historialActualizado : h
            );
            this.historialSubject.next(historialModificado);
            this.loadingSubject.next(false);
            observer.next(historialActualizado);
            observer.complete();
          },
          error: (error) => {
            const errorMsg = error.error?.message || 'Error al actualizar el registro de historial';
            this.errorSubject.next(errorMsg);
            this.loadingSubject.next(false);
            observer.error(errorMsg);
          }
        });
    });
  }

  // Eliminar registro de historial
  eliminarHistorial(id: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable(observer => {
      this.http.delete<void>(`${this.apiUrl}/${id}`)
        .subscribe({
          next: () => {
            // Remover de la lista local
            const historialActual = this.historialSubject.value;
            const historialFiltrado = historialActual.filter(h => h.id !== id);
            this.historialSubject.next(historialFiltrado);
            this.loadingSubject.next(false);
            observer.next();
            observer.complete();
          },
          error: (error) => {
            const errorMsg = error.error?.message || 'Error al eliminar el registro de historial';
            this.errorSubject.next(errorMsg);
            this.loadingSubject.next(false);
            observer.error(errorMsg);
          }
        });
    });
  }

  // Registrar cambio de estado
  registrarCambioEstado(
    vehiculoId: string,
    placa: string,
    estadoAnterior: string,
    estadoNuevo: string,
    motivo: string,
    observaciones?: string
  ): Observable<HistorialVehiculo> {
    const historial: HistorialVehiculoCreate = {
      vehiculoId,
      placa: placa.toUpperCase(),
      fechaCambio: new Date().toISOString(),
      tipoCambio: TipoCambioVehiculo.CAMBIO_ESTADO,
      estadoAnterior,
      estadoNuevo,
      motivo,
      observaciones,
      usuarioId: this.obtenerUsuarioId(), // Implementar método para obtener usuario actual
      oficinaId: this.obtenerOficinaId() // Implementar método para obtener oficina actual
    };

    return this.crearHistorial(historial);
  }

  // Registrar transferencia entre empresas
  registrarTransferenciaEmpresa(
    vehiculoId: string,
    placa: string,
    empresaOrigenId: string,
    empresaDestinoId: string,
    motivo: string,
    observaciones?: string
  ): Observable<HistorialVehiculo> {
    const historial: HistorialVehiculoCreate = {
      vehiculoId,
      placa: placa.toUpperCase(),
      fechaCambio: new Date().toISOString(),
      tipoCambio: TipoCambioVehiculo.TRANSFERENCIA_EMPRESA,
      empresaOrigenId,
      empresaDestinoId,
      motivo,
      observaciones,
      usuarioId: this.obtenerUsuarioId(),
      oficinaId: this.obtenerOficinaId()
    };

    return this.crearHistorial(historial);
  }

  // Registrar asignación de ruta
  registrarAsignacionRuta(
    vehiculoId: string,
    placa: string,
    rutaId: string,
    motivo: string,
    observaciones?: string
  ): Observable<HistorialVehiculo> {
    const historial: HistorialVehiculoCreate = {
      vehiculoId,
      placa: placa.toUpperCase(),
      fechaCambio: new Date().toISOString(),
      tipoCambio: TipoCambioVehiculo.ASIGNACION_RUTA,
      rutaId,
      motivo,
      observaciones,
      usuarioId: this.obtenerUsuarioId(),
      oficinaId: this.obtenerOficinaId()
    };

    return this.crearHistorial(historial);
  }

  // Registrar cambio de resolución
  registrarCambioResolucion(
    vehiculoId: string,
    placa: string,
    resolucionId: string,
    motivo: string,
    observaciones?: string
  ): Observable<HistorialVehiculo> {
    const historial: HistorialVehiculoCreate = {
      vehiculoId,
      placa: placa.toUpperCase(),
      fechaCambio: new Date().toISOString(),
      tipoCambio: TipoCambioVehiculo.CAMBIO_RESOLUCION,
      resolucionId,
      motivo,
      observaciones,
      usuarioId: this.obtenerUsuarioId(),
      oficinaId: this.obtenerOficinaId()
    };

    return this.crearHistorial(historial);
  }

  // Limpiar estado
  limpiarEstado(): void {
    this.historialSubject.next([]);
    this.errorSubject.next(null);
  }

  // Métodos auxiliares (implementar según la lógica de autenticación)
  private obtenerUsuarioId(): string {
    // Implementar lógica para obtener ID del usuario actual
    return 'usuario-actual-id';
  }

  private obtenerOficinaId(): string {
    // Implementar lógica para obtener ID de la oficina actual
    return 'oficina-actual-id';
  }
} 