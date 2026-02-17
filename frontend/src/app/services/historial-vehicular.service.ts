import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, catchError, throwError, tap } from 'rxjs';
import { 
  HistorialVehicular, 
  HistorialVehicularCreate,
  FiltrosHistorialVehicular,
  ResumenHistorialVehicular,
  TipoEventoHistorial,
  EstadoVehiculo,
  ConfiguracionHistorial,
  // Alias para compatibilidad
  HistorialVehiculo,
  HistorialVehiculoCreate,
  FiltroHistorialVehiculo,
  ResumenHistorialVehiculo,
  TipoCambioVehiculo
} from '../models/historial-vehicular.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistorialVehicularService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = environment.apiUrl;
  
  // Cache para optimizar consultas
  private historialCache = new BehaviorSubject<HistorialVehicular[]>([]);
  private resumenCache = new Map<string, ResumenHistorialVehicular>();

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtiene el historial vehicular con filtros
   */
  getHistorialVehicular(filtros: FiltrosHistorialVehicular): Observable<{
    historial: HistorialVehicular[];
    total: number;
    page: number;
    limit: number;
  }> {
    // console.log removed for production
    
    // Construir parámetros de consulta
    let params = new URLSearchParams();
    
    if (filtros.vehiculoId) params.append('vehiculoId', filtros.vehiculoId);
    if (filtros.placa) params.append('placa', filtros.placa);
    if (filtros.empresaId) params.append('empresaId', filtros.empresaId);
    if (filtros.tipoEvento && filtros.tipoEvento.length > 0) {
      filtros.tipoEvento.forEach(tipo => params.append('tipoEvento', tipo));
    }
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    
    const page = filtros.page || 1;
    const limit = filtros.limit || 25;
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.http.get<{
      historial: HistorialVehicular[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.apiUrl}/historial-vehicular?${params.toString()}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('[HISTORIAL-SERVICE] ❌ Error obteniendo historial vehicular::', error);
        
        // Retornar estructura vacía en caso de error
        return of({
          historial: [],
          total: 0,
          page,
          limit
        });
      })
    );
  }

  /**
   * Crea un nuevo registro en el historial
   */
  crearRegistroHistorial(registro: HistorialVehicularCreate): Observable<HistorialVehicular> {
    return this.http.post<HistorialVehicular>(`${this.apiUrl}/historial-vehicular/eventos`, registro, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creando registro de historial::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el resumen del historial de un vehículo específico
   */
  getResumenHistorialVehiculo(vehiculoId: string): Observable<ResumenHistorialVehicular> {
    // console.log removed for production
    
    // Verificar caché primero
    if (this.resumenCache.has(vehiculoId)) {
      // console.log removed for production
      return of(this.resumenCache.get(vehiculoId)!);
    }

    return this.http.get<ResumenHistorialVehicular>(`${this.apiUrl}/historial-vehicular/resumen/${vehiculoId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(resumen => {
        // Guardar en caché
        this.resumenCache.set(vehiculoId, resumen);
        // console.log removed for production
      }),
      catchError(error => {
        console.error('[HISTORIAL-SERVICE] ❌ Error obteniendo resumen de historial::', error);
        
        // Retornar resumen vacío en caso de error
        const resumenVacio: ResumenHistorialVehicular = {
          vehiculoId,
          placa: 'N/A',
          totalEventos: 0,
          ultimoEvento: undefined,
          eventosPorTipo: {},
          empresasHistoricas: [],
          resolucionesHistoricas: [],
          estadosHistoricos: []
        };
        
        return of(resumenVacio);
      })
    );
  }

  /**
   * Exporta el historial en diferentes formatos
   */
  exportarHistorial(filtros: FiltrosHistorialVehicular, formato: 'excel' | 'pdf' | 'csv' = 'excel'): Observable<Blob> {
    const params = new URLSearchParams();
    
    if (filtros.vehiculoId) params.append('vehiculoId', filtros.vehiculoId);
    if (filtros.placa) params.append('placa', filtros.placa);
    if (filtros.tipoEvento) {
      if (Array.isArray(filtros.tipoEvento)) {
        filtros.tipoEvento.forEach(tipo => params.append('tipoEvento', tipo));
      } else {
        params.append('tipoEvento', filtros.tipoEvento);
      }
    }
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    params.append('formato', formato);

    return this.http.get(`${this.apiUrl}/historial-vehicular/exportar?${params.toString()}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exportando historial::', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene la configuración del historial
   */
  getConfiguracionHistorial(): Observable<ConfiguracionHistorial> {
    return this.http.get<ConfiguracionHistorial>(`${this.apiUrl}/configuracion`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo configuración de historial::', error);
          // Retornar configuración por defecto
          return of({
            retencionDias: 2555, // 7 años
            compresionAutomatica: true,
            notificacionesActivas: true,
            auditoriaNivel: 'COMPLETO' as const,
            backupAutomatico: true,
            frecuenciaBackup: 'DIARIO' as const
          } as ConfiguracionHistorial);
        })
      );
  }

  /**
   * Registra la creación de un vehículo
   */
  registrarCreacionVehiculo(
    vehiculoId: string,
    placa: string,
    vehiculoData: any,
    usuarioId?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.CREACION,
      descripcion: `Vehículo ${placa} creado en el sistema`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      observaciones: 'Creación inicial del vehículo'
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Registra transferencia de empresa
   */
  registrarTransferenciaEmpresa(
    vehiculoId: string,
    placa: string,
    empresaOrigenId: string,
    empresaDestinoId: string,
    empresaOrigenNombre: string,
    empresaDestinoNombre: string,
    usuarioId?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.TRANSFERENCIA_EMPRESA,
      descripcion: `Vehículo ${placa} transferido de ${empresaOrigenNombre} a ${empresaDestinoNombre}`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      observaciones: `Transferencia de empresa: ${empresaOrigenId} → ${empresaDestinoId}`
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Registra cambio de estado
   */
  registrarCambioEstado(
    vehiculoId: string,
    placa: string,
    estadoAnterior: EstadoVehiculo,
    estadoNuevo: EstadoVehiculo,
    usuarioId?: string,
    observaciones?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.CAMBIO_ESTADO,
      descripcion: `Estado del vehículo ${placa} cambiado de ${estadoAnterior} a ${estadoNuevo}`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      estadoAnterior,
      estadoNuevo,
      observaciones: observaciones || 'Cambio de estado del vehículo'
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Registra modificación de vehículo
   */
  registrarModificacionVehiculo(
    vehiculoId: string,
    placa: string,
    vehiculoAnterior: any,
    vehiculoNuevo: any,
    usuarioId?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.MODIFICACION,
      descripcion: `Vehículo ${placa} modificado`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      observaciones: 'Modificación de datos del vehículo'
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Limpia la caché
   */
  limpiarCache(): void {
    this.historialCache.next([]);
    this.resumenCache.clear();
  }

  /**
   * Obtiene la caché del historial
   */
  getHistorialCache(): Observable<HistorialVehicular[]> {
    return this.historialCache.asObservable();
  }

  // ========================================
  // MÉTODOS ADICIONALES PARA COMPATIBILIDAD CON HistorialVehiculoService
  // ========================================

  /**
   * Obtener historial con filtros (alias compatible)
   */
  obtenerHistorial(filtros?: FiltrosHistorialVehicular): Observable<HistorialVehicular[]> {
    const filtrosCompletos: FiltrosHistorialVehicular = {
      ...filtros,
      page: filtros?.page || 1,
      limit: filtros?.limit || 100
    };

    return new Observable(observer => {
      this.getHistorialVehicular(filtrosCompletos).subscribe({
        next: (response) => {
          observer.next(response.historial);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Obtener historial de un vehículo específico (alias compatible)
   */
  obtenerHistorialVehiculo(vehiculoId: string): Observable<HistorialVehicular[]> {
    return this.obtenerHistorial({ vehiculoId });
  }

  /**
   * Obtener historial por placa (alias compatible)
   */
  obtenerHistorialPorPlaca(placa: string): Observable<HistorialVehicular[]> {
    return this.obtenerHistorial({ placa: placa.toUpperCase() });
  }

  /**
   * Obtener historial de una empresa (alias compatible)
   */
  obtenerHistorialEmpresa(empresaId: string): Observable<HistorialVehicular[]> {
    return this.obtenerHistorial({ empresaId });
  }

  /**
   * Obtener resumen del historial (alias compatible)
   */
  obtenerResumenHistorial(vehiculoId: string): Observable<ResumenHistorialVehicular> {
    return this.getResumenHistorialVehiculo(vehiculoId);
  }

  /**
   * Crear nuevo registro de historial (alias compatible)
   */
  crearHistorial(historial: HistorialVehicularCreate): Observable<HistorialVehicular> {
    return this.crearRegistroHistorial(historial);
  }

  /**
   * Actualizar registro de historial
   */
  actualizarHistorial(id: string, actualizacion: any): Observable<HistorialVehicular> {
    return this.http.put<HistorialVehicular>(`${this.apiUrl}/historial-vehicular/${id}`, actualizacion, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Limpiar caché al actualizar
        this.resumenCache.clear();
      }),
      catchError(error => {
        console.error('Error actualizando registro de historial::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar registro de historial
   */
  eliminarHistorial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/historial-vehicular/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Limpiar caché al eliminar
        this.resumenCache.clear();
      }),
      catchError(error => {
        console.error('Error eliminando registro de historial::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Registrar asignación de ruta
   */
  registrarAsignacionRuta(
    vehiculoId: string,
    placa: string,
    rutaId: string,
    motivo: string,
    observaciones?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.ASIGNACION_RUTA,
      descripcion: motivo,
      fechaEvento: new Date().toISOString(),
      rutaId,
      observaciones
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Registrar cambio de resolución
   */
  registrarCambioResolucion(
    vehiculoId: string,
    placa: string,
    resolucionId: string,
    motivo: string,
    observaciones?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.CAMBIO_RESOLUCION,
      descripcion: motivo,
      fechaEvento: new Date().toISOString(),
      resolucionId,
      observaciones
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Limpiar estado (alias compatible)
   */
  limpiarEstado(): void {
    this.limpiarCache();
  }
}