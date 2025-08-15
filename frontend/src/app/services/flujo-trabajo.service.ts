import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FlujoTrabajo {
  id: string;
  nombre: string;
  descripcion: string;
  tipoTramite: string;
  oficinas: OficinaFlujo[];
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  version: string;
  creadoPor: string;
  modificadoPor?: string;
}

export interface OficinaFlujo {
  id: string;
  oficinaId: string;
  orden: number;
  tiempoEstimado: number;
  esObligatoria: boolean;
  puedeRechazar: boolean;
  puedeDevolver: boolean;
  documentosRequeridos: string[];
  condiciones: string[];
  responsableId?: string;
  notificaciones: NotificacionFlujo[];
}

export interface NotificacionFlujo {
  tipo: 'EMAIL' | 'SMS' | 'SISTEMA';
  destinatario: string;
  momento: 'AL_LLEGAR' | 'AL_SALIR' | 'DIARIA' | 'SEMANAL';
  plantilla: string;
  activa: boolean;
}

export interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  flujoId: string;
  oficinaOrigenId?: string;
  oficinaDestinoId: string;
  fechaMovimiento: Date;
  usuarioId: string;
  usuarioNombre: string;
  motivo: string;
  observaciones?: string;
  documentosRequeridos: string[];
  documentosEntregados: string[];
  tiempoEstimado: number;
  prioridad: string;
  urgencia: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO' | 'DEVUELTO';
  fechaLimite: Date;
  fechaCompletado?: Date;
  comentarios?: string;
}

export interface EstadoFlujo {
  expedienteId: string;
  flujoId: string;
  oficinaActualId: string;
  pasoActual: number;
  totalPasos: number;
  porcentajeCompletado: number;
  tiempoTranscurrido: number;
  tiempoEstimado: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO' | 'PAUSADO';
  historial: HistorialPaso[];
  proximaRevision?: Date;
  recordatorios: RecordatorioFlujo[];
}

export interface HistorialPaso {
  paso: number;
  oficinaId: string;
  oficinaNombre: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  tiempoEnOficina: number;
  usuarioId: string;
  usuarioNombre: string;
  accion: string;
  comentarios?: string;
  documentos: string[];
  estado: string;
}

export interface RecordatorioFlujo {
  id: string;
  tipo: 'DIARIO' | 'SEMANAL' | 'PERSONALIZADO';
  mensaje: string;
  fechaCreacion: Date;
  fechaProximo: Date;
  activo: boolean;
  destinatarios: string[];
}

export interface FlujoFiltros {
  nombre?: string;
  tipoTramite?: string;
  activo?: boolean;
  oficinaId?: string;
  fechaCreacionDesde?: Date;
  fechaCreacionHasta?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FlujoTrabajoService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/flujos-trabajo`;

  // BehaviorSubjects para estado reactivo
  private flujosSubject = new BehaviorSubject<FlujoTrabajo[]>([]);
  private flujoActivoSubject = new BehaviorSubject<FlujoTrabajo | null>(null);
  private movimientosSubject = new BehaviorSubject<MovimientoExpediente[]>([]);
  private estadosSubject = new BehaviorSubject<EstadoFlujo[]>([]);

  // Observables públicos
  flujos$ = this.flujosSubject.asObservable();
  flujoActivo$ = this.flujoActivoSubject.asObservable();
  movimientos$ = this.movimientosSubject.asObservable();
  estados$ = this.estadosSubject.asObservable();

  // Métodos para Flujos de Trabajo
  getFlujos(filtros?: FlujoFiltros): Observable<FlujoTrabajo[]> {
    let params = '';
    if (filtros) {
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      params = queryParams.toString();
    }

    const url = params ? `${this.baseUrl}?${params}` : this.baseUrl;
    
    return this.http.get<FlujoTrabajo[]>(url);
  }

  getFlujoById(id: string): Observable<FlujoTrabajo> {
    return this.http.get<FlujoTrabajo>(`${this.baseUrl}/${id}`);
  }

  crearFlujo(flujo: Omit<FlujoTrabajo, 'id' | 'fechaCreacion' | 'version' | 'creadoPor'>): Observable<FlujoTrabajo> {
    return this.http.post<FlujoTrabajo>(this.baseUrl, flujo);
  }

  actualizarFlujo(id: string, flujo: Partial<FlujoTrabajo>): Observable<FlujoTrabajo> {
    return this.http.put<FlujoTrabajo>(`${this.baseUrl}/${id}`, flujo);
  }

  eliminarFlujo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  activarFlujo(id: string): Observable<FlujoTrabajo> {
    return this.http.patch<FlujoTrabajo>(`${this.baseUrl}/${id}/activar`, {});
  }

  desactivarFlujo(id: string): Observable<FlujoTrabajo> {
    return this.http.patch<FlujoTrabajo>(`${this.baseUrl}/${id}/desactivar`, {});
  }

  // Métodos para Movimientos de Expedientes
  getMovimientos(expedienteId?: string): Observable<MovimientoExpediente[]> {
    const url = expedienteId ? `${this.baseUrl}/movimientos?expedienteId=${expedienteId}` : `${this.baseUrl}/movimientos`;
    return this.http.get<MovimientoExpediente[]>(url);
  }

  crearMovimiento(movimiento: Omit<MovimientoExpediente, 'id' | 'fechaMovimiento'>): Observable<MovimientoExpediente> {
    return this.http.post<MovimientoExpediente>(`${this.baseUrl}/movimientos`, movimiento);
  }

  actualizarMovimiento(id: string, movimiento: Partial<MovimientoExpediente>): Observable<MovimientoExpediente> {
    return this.http.put<MovimientoExpediente>(`${this.baseUrl}/movimientos/${id}`, movimiento);
  }

  moverExpediente(movimiento: Omit<MovimientoExpediente, 'id' | 'fechaMovimiento'>): Observable<MovimientoExpediente> {
    return this.http.post<MovimientoExpediente>(`${this.baseUrl}/mover-expediente`, movimiento);
  }

  // Métodos para Estados de Flujo
  getEstadoFlujo(expedienteId: string): Observable<EstadoFlujo> {
    return this.http.get<EstadoFlujo>(`${this.baseUrl}/estados/${expedienteId}`);
  }

  getEstadosFlujo(filtros?: any): Observable<EstadoFlujo[]> {
    let params = '';
    if (filtros) {
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      params = queryParams.toString();
    }

    const url = params ? `${this.baseUrl}/estados?${params}` : `${this.baseUrl}/estados`;
    return this.http.get<EstadoFlujo[]>(url);
  }

  actualizarEstado(expedienteId: string, estado: Partial<EstadoFlujo>): Observable<EstadoFlujo> {
    return this.http.put<EstadoFlujo>(`${this.baseUrl}/estados/${expedienteId}`, estado);
  }

  // Métodos para Reportes y Analytics
  getReporteFlujo(flujoId: string, fechaDesde: Date, fechaHasta: Date): Observable<any> {
    const params = new URLSearchParams({
      fechaDesde: fechaDesde.toISOString(),
      fechaHasta: fechaHasta.toISOString()
    });
    
    return this.http.get<any>(`${this.baseUrl}/${flujoId}/reporte?${params}`);
  }

  getMetricasFlujo(flujoId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${flujoId}/metricas`);
  }

  getDashboardFlujos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  // Métodos para Validaciones
  validarFlujo(flujo: FlujoTrabajo): Observable<{ valido: boolean; errores: string[] }> {
    return this.http.post<{ valido: boolean; errores: string[] }>(`${this.baseUrl}/validar`, flujo);
  }

  validarMovimiento(movimiento: MovimientoExpediente): Observable<{ valido: boolean; errores: string[] }> {
    return this.http.post<{ valido: boolean; errores: string[] }>(`${this.baseUrl}/movimientos/validar`, movimiento);
  }

  // Métodos para Notificaciones
  enviarNotificacion(notificacion: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/notificaciones`, notificacion);
  }

  getNotificacionesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notificaciones/pendientes`);
  }

  // Métodos para Cache y Estado Local
  actualizarFlujosLocales(flujos: FlujoTrabajo[]): void {
    this.flujosSubject.next(flujos);
  }

  actualizarMovimientosLocales(movimientos: MovimientoExpediente[]): void {
    this.movimientosSubject.next(movimientos);
  }

  actualizarEstadosLocales(estados: EstadoFlujo[]): void {
    this.estadosSubject.next(estados);
  }

  setFlujoActivo(flujo: FlujoTrabajo | null): void {
    this.flujoActivoSubject.next(flujo);
  }

  // Métodos de Utilidad
  calcularTiempoEstimado(flujo: FlujoTrabajo): number {
    return flujo.oficinas.reduce((total, oficina) => total + oficina.tiempoEstimado, 0);
  }

  obtenerOficinaSiguiente(flujo: FlujoTrabajo, oficinaActualId: string): OficinaFlujo | null {
    const oficinaActual = flujo.oficinas.find(o => o.oficinaId === oficinaActualId);
    if (!oficinaActual) return null;

    const siguienteOrden = oficinaActual.orden + 1;
    return flujo.oficinas.find(o => o.orden === siguienteOrden) || null;
  }

  obtenerOficinaAnterior(flujo: FlujoTrabajo, oficinaActualId: string): OficinaFlujo | null {
    const oficinaActual = flujo.oficinas.find(o => o.oficinaId === oficinaActualId);
    if (!oficinaActual) return null;

    const anteriorOrden = oficinaActual.orden - 1;
    return flujo.oficinas.find(o => o.orden === anteriorOrden) || null;
  }

  esUltimaOficina(flujo: FlujoTrabajo, oficinaId: string): boolean {
    const oficina = flujo.oficinas.find(o => o.oficinaId === oficinaId);
    if (!oficina) return false;

    const maxOrden = Math.max(...flujo.oficinas.map(o => o.orden));
    return oficina.orden === maxOrden;
  }

  esPrimeraOficina(flujo: FlujoTrabajo, oficinaId: string): boolean {
    const oficina = flujo.oficinas.find(o => o.oficinaId === oficinaId);
    if (!oficina) return false;

    const minOrden = Math.min(...flujo.oficinas.map(o => o.orden));
    return oficina.orden === minOrden;
  }

  // Métodos para Exportación
  exportarFlujo(flujoId: string, formato: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${flujoId}/exportar?formato=${formato}`, {
      responseType: 'blob'
    });
  }

  exportarReporte(filtros: any, formato: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    const params = new URLSearchParams(filtros);
    return this.http.get(`${this.baseUrl}/exportar-reporte?${params}&formato=${formato}`, {
      responseType: 'blob'
    });
  }
} 