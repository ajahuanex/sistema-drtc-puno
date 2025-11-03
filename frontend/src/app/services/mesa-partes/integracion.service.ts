import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Integracion,
  IntegracionCreate,
  IntegracionUpdate,
  LogSincronizacion,
  ResultadoConexion,
  DocumentoExterno,
  EstadoSincronizacion,
  ConfiguracionWebhook
} from '../../models/mesa-partes/integracion.model';

@Injectable({
  providedIn: 'root'
})
export class IntegracionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v1/integraciones';

  /**
   * Crear una nueva integración
   * Requirements: 4.1, 4.2
   */
  crearIntegracion(integracion: IntegracionCreate): Observable<Integracion> {
    return this.http.post<Integracion>(this.apiUrl, integracion);
  }

  /**
   * Obtener una integración por ID
   * Requirements: 4.1
   */
  obtenerIntegracion(id: string): Observable<Integracion> {
    return this.http.get<Integracion>(`${this.apiUrl}/${id}`);
  }

  /**
   * Listar todas las integraciones
   * Requirements: 4.1
   */
  listarIntegraciones(activa?: boolean): Observable<Integracion[]> {
    let params = new HttpParams();

    if (activa !== undefined) {
      params = params.set('activa', activa.toString());
    }

    return this.http.get<Integracion[]>(this.apiUrl, { params });
  }

  /**
   * Actualizar una integración existente
   * Requirements: 4.1, 4.2
   */
  actualizarIntegracion(
    id: string,
    datos: IntegracionUpdate
  ): Observable<Integracion> {
    return this.http.put<Integracion>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Eliminar una integración
   * Requirements: 4.1
   */
  eliminarIntegracion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Probar conexión con una integración
   * Requirements: 4.2
   */
  probarConexion(id: string): Observable<ResultadoConexion> {
    return this.http.post<ResultadoConexion>(
      `${this.apiUrl}/${id}/probar`,
      {}
    );
  }

  /**
   * Enviar documento a una mesa de partes externa
   * Requirements: 4.3, 4.4
   */
  enviarDocumento(
    integracionId: string,
    documentoId: string
  ): Observable<{
    exitoso: boolean;
    mensaje: string;
    idExterno?: string;
  }> {
    return this.http.post<{
      exitoso: boolean;
      mensaje: string;
      idExterno?: string;
    }>(`${this.apiUrl}/${integracionId}/enviar/${documentoId}`, {});
  }

  /**
   * Recibir documento desde una mesa de partes externa
   * Requirements: 4.3, 4.4
   */
  recibirDocumentoExterno(
    integracionId: string,
    documentoExterno: DocumentoExterno
  ): Observable<{
    exitoso: boolean;
    mensaje: string;
    documentoId?: string;
  }> {
    return this.http.post<{
      exitoso: boolean;
      mensaje: string;
      documentoId?: string;
    }>(`${this.apiUrl}/${integracionId}/recibir`, documentoExterno);
  }

  /**
   * Obtener log de sincronizaciones
   * Requirements: 4.5, 4.6
   */
  obtenerLogSincronizacion(
    integracionId: string,
    estado?: EstadoSincronizacion,
    fechaDesde?: Date,
    fechaHasta?: Date,
    page?: number,
    pageSize?: number
  ): Observable<{
    logs: LogSincronizacion[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }
    if (fechaDesde) {
      params = params.set('fecha_desde', fechaDesde.toISOString());
    }
    if (fechaHasta) {
      params = params.set('fecha_hasta', fechaHasta.toISOString());
    }
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<{
      logs: LogSincronizacion[];
      total: number;
      page: number;
      pageSize: number;
    }>(`${this.apiUrl}/${integracionId}/log`, { params });
  }

  /**
   * Configurar webhook para una integración
   * Requirements: 10.3, 10.4
   */
  configurarWebhook(
    integracionId: string,
    configuracion: ConfiguracionWebhook
  ): Observable<Integracion> {
    return this.http.post<Integracion>(
      `${this.apiUrl}/${integracionId}/webhook`,
      configuracion
    );
  }

  /**
   * Probar webhook de una integración
   * Requirements: 10.3, 10.4
   */
  probarWebhook(
    integracionId: string,
    configuracion: ConfiguracionWebhook
  ): Observable<ResultadoConexion> {
    return this.http.post<ResultadoConexion>(
      `${this.apiUrl}/${integracionId}/webhook/probar`,
      configuracion
    );
  }

  /**
   * Activar/Desactivar una integración
   * Requirements: 4.1
   */
  toggleIntegracion(id: string, activa: boolean): Observable<Integracion> {
    return this.http.patch<Integracion>(`${this.apiUrl}/${id}/toggle`, {
      activa
    });
  }

  /**
   * Sincronizar estado de documento con sistema externo
   * Requirements: 4.6, 4.7
   */
  sincronizarEstado(
    integracionId: string,
    documentoId: string
  ): Observable<{
    exitoso: boolean;
    mensaje: string;
    estadoExterno?: string;
  }> {
    return this.http.post<{
      exitoso: boolean;
      mensaje: string;
      estadoExterno?: string;
    }>(`${this.apiUrl}/${integracionId}/sincronizar/${documentoId}`, {});
  }

  /**
   * Obtener estadísticas de una integración
   * Requirements: 4.5, 4.6
   */
  obtenerEstadisticas(integracionId: string): Observable<{
    totalEnviados: number;
    totalRecibidos: number;
    exitosos: number;
    fallidos: number;
    pendientes: number;
    ultimaSincronizacion?: Date;
  }> {
    return this.http.get<{
      totalEnviados: number;
      totalRecibidos: number;
      exitosos: number;
      fallidos: number;
      pendientes: number;
      ultimaSincronizacion?: Date;
    }>(`${this.apiUrl}/${integracionId}/estadisticas`);
  }

  /**
   * Reintentar sincronización fallida
   * Requirements: 4.7
   */
  reintentarSincronizacion(logId: string): Observable<{
    exitoso: boolean;
    mensaje: string;
  }> {
    return this.http.post<{
      exitoso: boolean;
      mensaje: string;
    }>(`${this.apiUrl}/log/${logId}/reintentar`, {});
  }

  /**
   * Validar mapeo de campos
   * Requirements: 4.8
   */
  validarMapeo(
    integracionId: string,
    documentoEjemplo: any
  ): Observable<{
    valido: boolean;
    errores: string[];
    advertencias: string[];
  }> {
    return this.http.post<{
      valido: boolean;
      errores: string[];
      advertencias: string[];
    }>(`${this.apiUrl}/${integracionId}/validar-mapeo`, {
      documento: documentoEjemplo
    });
  }

  /**
   * Obtener eventos disponibles para webhooks
   * Requirements: 10.3
   */
  obtenerEventosDisponibles(): Observable<{
    evento: string;
    descripcion: string;
  }[]> {
    return this.http.get<{
      evento: string;
      descripcion: string;
    }[]>(`${this.apiUrl}/eventos-webhook`);
  }

  /**
   * Regenerar secreto de webhook
   * Requirements: 10.4
   */
  regenerarSecretoWebhook(integracionId: string): Observable<{
    secreto: string;
  }> {
    return this.http.post<{
      secreto: string;
    }>(`${this.apiUrl}/${integracionId}/webhook/regenerar-secreto`, {});
  }
}
