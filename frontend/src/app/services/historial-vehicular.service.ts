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
  ConfiguracionHistorial
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
    console.log('[HISTORIAL-SERVICE] 🔍 Obteniendo historial vehicular con filtros:', filtros);
    
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
        console.error('[HISTORIAL-SERVICE] ❌ Error obteniendo historial vehicular:', error);
        
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
        console.error('Error creando registro de historial:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el resumen del historial de un vehículo específico
   */
  getResumenHistorialVehiculo(vehiculoId: string): Observable<ResumenHistorialVehicular> {
    console.log('[HISTORIAL-SERVICE] 📊 Obteniendo resumen de historial para vehículo:', vehiculoId);
    
    // Verificar caché primero
    if (this.resumenCache.has(vehiculoId)) {
      console.log('[HISTORIAL-SERVICE] 💾 Resumen obtenido desde caché');
      return of(this.resumenCache.get(vehiculoId)!);
    }

    return this.http.get<ResumenHistorialVehicular>(`${this.apiUrl}/historial-vehicular/resumen/${vehiculoId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(resumen => {
        // Guardar en caché
        this.resumenCache.set(vehiculoId, resumen);
        console.log('[HISTORIAL-SERVICE] ✅ Resumen obtenido y guardado en caché');
      }),
      catchError(error => {
        console.error('[HISTORIAL-SERVICE] ❌ Error obteniendo resumen de historial:', error);
        
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
        console.error('Error exportando historial:', error);
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
          console.error('Error obteniendo configuración de historial:', error);
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
}