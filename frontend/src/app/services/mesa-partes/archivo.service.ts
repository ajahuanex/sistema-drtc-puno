/**
 * Service for Archivo operations
 * Requirements: 9.3, 9.4, 9.5, 9.7
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Archivo,
  ArchivoCreate,
  ArchivoUpdate,
  ArchivoRestaurar,
  FiltrosArchivo,
  ArchivoEstadisticas,
  ArchivoListResponse
} from '../../models/mesa-partes/archivo.model';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  private apiUrl = `${environment.apiUrl}/mesa-partes/archivo`;

  constructor(private http: HttpClient) {}

  /**
   * Archive a documento
   * Requirements: 9.1, 9.2, 9.3
   */
  archivarDocumento(archivoData: ArchivoCreate): Observable<Archivo> {
    return this.http.post<Archivo>(`${this.apiUrl}/`, archivoData);
  }

  /**
   * Get archivo by ID
   * Requirements: 9.3, 9.4
   */
  obtenerArchivo(archivoId: string): Observable<Archivo> {
    return this.http.get<Archivo>(`${this.apiUrl}/${archivoId}`);
  }

  /**
   * Get archivo by documento ID
   * Requirements: 9.3, 9.4
   */
  obtenerArchivoPorDocumento(documentoId: string): Observable<Archivo> {
    return this.http.get<Archivo>(`${this.apiUrl}/documento/${documentoId}`);
  }

  /**
   * Get archivo by codigo_ubicacion
   * Requirements: 9.7
   */
  obtenerArchivoPorCodigo(codigoUbicacion: string): Observable<Archivo> {
    return this.http.get<Archivo>(`${this.apiUrl}/codigo/${codigoUbicacion}`);
  }

  /**
   * List archivos with filters
   * Requirements: 9.3, 9.4, 9.5
   */
  listarArchivos(filtros: FiltrosArchivo): Observable<ArchivoListResponse> {
    let params = new HttpParams();

    if (filtros.clasificacion) {
      params = params.set('clasificacion', filtros.clasificacion);
    }
    if (filtros.politica_retencion) {
      params = params.set('politica_retencion', filtros.politica_retencion);
    }
    if (filtros.codigo_ubicacion) {
      params = params.set('codigo_ubicacion', filtros.codigo_ubicacion);
    }
    if (filtros.fecha_archivado_desde) {
      params = params.set('fecha_archivado_desde', filtros.fecha_archivado_desde.toISOString());
    }
    if (filtros.fecha_archivado_hasta) {
      params = params.set('fecha_archivado_hasta', filtros.fecha_archivado_hasta.toISOString());
    }
    if (filtros.usuario_archivo_id) {
      params = params.set('usuario_archivo_id', filtros.usuario_archivo_id);
    }
    if (filtros.activo) {
      params = params.set('activo', filtros.activo);
    }
    if (typeof filtros.proximos_a_expirar !== "undefined") {
      params = params.set('proximos_a_expirar', filtros.proximos_a_expirar.toString());
    }
    if (filtros.numero_expediente) {
      params = params.set('numero_expediente', filtros.numero_expediente);
    }
    if (filtros.remitente) {
      params = params.set('remitente', filtros.remitente);
    }
    if (filtros.asunto) {
      params = params.set('asunto', filtros.asunto);
    }

    params = params.set('page', filtros.page?.toString() || '1');
    params = params.set('size', filtros.size?.toString() || '20');
    params = params.set('sort_by', filtros.sort_by || 'fecha_archivado');
    params = params.set('sort_order', filtros.sort_order || 'desc');

    return this.http.get<ArchivoListResponse>(`${this.apiUrl}/`, { params });
  }

  /**
   * Update archivo information
   * Requirements: 9.3
   */
  actualizarArchivo(archivoId: string, archivoData: ArchivoUpdate): Observable<Archivo> {
    return this.http.put<Archivo>(`${this.apiUrl}/${archivoId}`, archivoData);
  }

  /**
   * Restore an archived documento
   * Requirements: 9.5
   */
  restaurarDocumento(archivoId: string, restaurarData: ArchivoRestaurar): Observable<Archivo> {
    return this.http.post<Archivo>(`${this.apiUrl}/${archivoId}/restaurar`, restaurarData);
  }

  /**
   * Get archivo statistics
   * Requirements: 9.3
   */
  obtenerEstadisticas(): Observable<ArchivoEstadisticas> {
    return this.http.get<ArchivoEstadisticas>(`${this.apiUrl}/estadisticas/general`);
  }

  /**
   * Get archivos that will expire soon
   * Requirements: 9.6
   */
  obtenerProximosAExpirar(dias: number = 30): Observable<Archivo[]> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.http.get<Archivo[]>(`${this.apiUrl}/alertas/proximos-a-expirar`, { params });
  }

  /**
   * Get archivos with expired retention policy
   * Requirements: 9.6
   */
  obtenerExpirados(): Observable<Archivo[]> {
    return this.http.get<Archivo[]>(`${this.apiUrl}/alertas/expirados`);
  }
}
