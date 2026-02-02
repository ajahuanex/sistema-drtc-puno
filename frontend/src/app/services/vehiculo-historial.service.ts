import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { 
  VehiculoHistorial, 
  VehiculoHistorialCreate, 
  VehiculoHistorialUpdate,
  VehiculoHistorialFiltros,
  EstadisticasHistorial,
  ResumenHistorialVehiculo,
  TipoMovimientoHistorial
} from '../models/vehiculo-historial.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehiculoHistorialService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ========================================
  // MÉTODOS CRUD BÁSICOS
  // ========================================

  /**
   * Obtener historial de un vehículo específico
   */
  getHistorialVehiculo(vehiculoId: string): Observable<VehiculoHistorial[]> {
    return this.http.get<VehiculoHistorial[]>(`${this.apiUrl}/vehiculos-historial/vehiculo/${vehiculoId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo historial del vehículo::', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener todos los registros de historial con filtros
   */
  getHistorial(filtros?: VehiculoHistorialFiltros, skip: number = 0, limit: number = 100): Observable<VehiculoHistorial[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<VehiculoHistorial[]>(`${this.apiUrl}/vehiculos-historial`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo historial::', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener un registro de historial por ID
   */
  getHistorialById(historialId: string): Observable<VehiculoHistorial | null> {
    return this.http.get<VehiculoHistorial>(`${this.apiUrl}/vehiculos-historial/${historialId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo registro de historial::', error);
        return of(null);
      })
    );
  }

  /**
   * Crear nuevo registro de historial
   */
  crearRegistroHistorial(historialData: VehiculoHistorialCreate): Observable<VehiculoHistorial> {
    return this.http.post<VehiculoHistorial>(`${this.apiUrl}/vehiculos-historial`, historialData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creando registro de historial::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar registro de historial
   */
  actualizarRegistroHistorial(historialId: string, historialData: VehiculoHistorialUpdate): Observable<VehiculoHistorial> {
    return this.http.put<VehiculoHistorial>(`${this.apiUrl}/vehiculos-historial/${historialId}`, historialData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error actualizando registro de historial::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar registro de historial (soft delete)
   */
  eliminarRegistroHistorial(historialId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehiculos-historial/${historialId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error eliminando registro de historial::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // MÉTODOS DE GESTIÓN AUTOMÁTICA
  // ========================================

  /**
   * Registrar movimiento automático cuando se actualiza un vehículo
   */
  registrarMovimientoVehiculo(
    vehiculoId: string, 
    tipoMovimiento: TipoMovimientoHistorial,
    datosAnteriores: any,
    datosNuevos: any,
    motivoCambio?: string
  ): Observable<VehiculoHistorial> {
    const historialData: VehiculoHistorialCreate = {
      vehiculoId,
      tipoMovimiento,
      empresaAnteriorId: datosAnteriores.empresaActualId,
      empresaActualId: datosNuevos.empresaActualId,
      resolucionAnteriorId: datosAnteriores.resolucionId,
      resolucionActualId: datosNuevos.resolucionId,
      estadoAnterior: datosAnteriores.estado,
      estadoActual: datosNuevos.estado,
      motivoCambio,
      usuarioId: this.authService.getCurrentUser()?.id
    };

    return this.crearRegistroHistorial(historialData);
  }

  /**
   * Marcar todos los vehículos como historial actual
   */
  marcarVehiculosComoActuales(): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehiculos-historial/marcar-actuales`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error marcando vehículos como actuales::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar historial de todos los vehículos
   */
  actualizarHistorialTodos(): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehiculos-historial/actualizar-todos`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error actualizando historial de todos::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // MÉTODOS DE ESTADÍSTICAS Y REPORTES
  // ========================================

  /**
   * Obtener estadísticas del historial
   */
  getEstadisticasHistorial(): Observable<EstadisticasHistorial> {
    return this.http.get<EstadisticasHistorial>(`${this.apiUrl}/vehiculos-historial/estadisticas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas de historial::', error);
        return of({
          totalRegistros: 0,
          vehiculosConHistorial: 0,
          movimientosPorTipo: {} as any,
          movimientosPorMes: [],
          empresasConMasMovimientos: [],
          ultimaActualizacion: new Date()
        });
      })
    );
  }

  /**
   * Obtener resumen de historial por vehículo
   */
  getResumenHistorialVehiculos(): Observable<ResumenHistorialVehiculo[]> {
    return this.http.get<ResumenHistorialVehiculo[]>(`${this.apiUrl}/vehiculos-historial/resumen`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo resumen de historial::', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener historial de una empresa específica
   */
  getHistorialEmpresa(empresaId: string): Observable<VehiculoHistorial[]> {
    return this.http.get<VehiculoHistorial[]>(`${this.apiUrl}/empresas/${empresaId}/vehiculos-historial`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo historial de empresa::', error);
        return of([]);
      })
    );
  }

  /**
   * Exportar historial a CSV
   */
  exportarHistorial(filtros?: VehiculoHistorialFiltros): Observable<Blob> {
    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/vehiculos-historial/exportar`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exportando historial::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  /**
   * Obtener tipos de movimiento disponibles
   */
  getTiposMovimiento(): TipoMovimientoHistorial[] {
    return [
      'REGISTRO_INICIAL',
      'CAMBIO_EMPRESA',
      'CAMBIO_RESOLUCION',
      'CAMBIO_ESTADO',
      'ACTUALIZACION_DATOS',
      'CAMBIO_PLACA',
      'BAJA_VEHICULO',
      'REACTIVACION',
      'MANTENIMIENTO',
      'INSPECCION',
      'OTRO'
    ];
  }

  /**
   * Obtener descripción de tipo de movimiento
   */
  getDescripcionTipoMovimiento(tipo: TipoMovimientoHistorial): string {
    const descripciones = {
      'REGISTRO_INICIAL': 'Registro Inicial',
      'CAMBIO_EMPRESA': 'Cambio de Empresa',
      'CAMBIO_RESOLUCION': 'Cambio de Resolución',
      'CAMBIO_ESTADO': 'Cambio de Estado',
      'ACTUALIZACION_DATOS': 'Actualización de Datos',
      'CAMBIO_PLACA': 'Cambio de Placa',
      'BAJA_VEHICULO': 'Baja del Vehículo',
      'REACTIVACION': 'Reactivación',
      'MANTENIMIENTO': 'Mantenimiento',
      'INSPECCION': 'Inspección Técnica',
      'OTRO': 'Otro'
    };

    return descripciones[tipo] || tipo;
  }

  /**
   * Validar si se puede crear un registro de historial
   */
  validarRegistroHistorial(historialData: VehiculoHistorialCreate): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!historialData.vehiculoId) {
      errores.push('ID del vehículo es requerido');
    }

    if (!historialData.tipoMovimiento) {
      errores.push('Tipo de movimiento es requerido');
    }

    if (!historialData.empresaActualId) {
      errores.push('Empresa actual es requerida');
    }

    if (!historialData.estadoActual) {
      errores.push('Estado actual es requerido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}