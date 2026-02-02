import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Derivacion,
  DerivacionCreate,
  DerivacionUpdate,
  DerivacionMultiple,
  HistorialDerivacion,
  EstadoDerivacion
} from '../../models/mesa-partes/derivacion.model';
import { Documento } from '../../models/mesa-partes/documento.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DerivacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/derivaciones`;

  /**
   * Derivar un documento a otra área
   * Requirements: 3.1, 3.2, 3.3
   */
  derivarDocumento(derivacion: DerivacionCreate): Observable<Derivacion> {
    return this.http.post<Derivacion>(this.apiUrl, derivacion);
  }

  /**
   * Derivar un documento a múltiples áreas
   * Requirements: 3.1, 3.2
   */
  derivarDocumentoMultiple(derivacion: DerivacionMultiple): Observable<Derivacion[]> {
    return this.http.post<Derivacion[]>(`${this.apiUrl}/multiple`, derivacion);
  }

  /**
   * Recibir un documento derivado
   * Requirements: 3.4
   */
  recibirDocumento(derivacionId: string): Observable<Derivacion> {
    return this.http.put<Derivacion>(`${this.apiUrl}/${derivacionId}/recibir`, {});
  }

  /**
   * Obtener historial completo de derivaciones de un documento
   * Requirements: 3.5, 3.6
   */
  obtenerHistorial(documentoId: string): Observable<HistorialDerivacion> {
    return this.http.get<HistorialDerivacion>(
      `${this.apiUrl}/documento/${documentoId}`
    );
  }

  /**
   * Obtener documentos de un área específica
   * Requirements: 3.4
   */
  obtenerDocumentosArea(
    areaId: string,
    estado?: EstadoDerivacion,
    page?: number,
    pageSize?: number
  ): Observable<{
    documentos: Documento[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }
    if (typeof page !== "undefined") {
      params = params.set('page', page.toString());
    }
    if (typeof pageSize !== "undefined") {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<{
      documentos: Documento[];
      total: number;
      page: number;
      pageSize: number;
    }>(`${this.apiUrl}/area/${areaId}`, { params });
  }

  /**
   * Registrar atención de un documento derivado
   * Requirements: 3.7, 3.8
   */
  registrarAtencion(
    derivacionId: string,
    observaciones: string,
    archivosRespuesta?: File[]
  ): Observable<Derivacion> {
    const formData = new FormData();
    formData.append('observaciones', observaciones);

    if (archivosRespuesta && archivosRespuesta.length > 0) {
      archivosRespuesta.forEach((archivo, index) => {
        formData.append(`archivos`, archivo);
      });
    }

    return this.http.put<Derivacion>(
      `${this.apiUrl}/${derivacionId}/atender`,
      formData
    );
  }

  /**
   * Actualizar una derivación
   * Requirements: 3.7
   */
  actualizarDerivacion(
    derivacionId: string,
    datos: DerivacionUpdate
  ): Observable<Derivacion> {
    return this.http.put<Derivacion>(`${this.apiUrl}/${derivacionId}`, datos);
  }

  /**
   * Obtener derivación por ID
   * Requirements: 3.5
   */
  obtenerDerivacion(derivacionId: string): Observable<Derivacion> {
    return this.http.get<Derivacion>(`${this.apiUrl}/${derivacionId}`);
  }

  /**
   * Obtener derivaciones pendientes de un área
   * Requirements: 3.4, 8.2
   */
  obtenerDerivacionesPendientes(areaId: string): Observable<Derivacion[]> {
    return this.http.get<Derivacion[]>(
      `${this.apiUrl}/area/${areaId}/pendientes`
    );
  }

  /**
   * Obtener derivaciones urgentes de un área
   * Requirements: 3.3, 8.3
   */
  obtenerDerivacionesUrgentes(areaId: string): Observable<Derivacion[]> {
    return this.http.get<Derivacion[]>(
      `${this.apiUrl}/area/${areaId}/urgentes`
    );
  }

  /**
   * Obtener derivaciones próximas a vencer
   * Requirements: 3.7, 8.2
   */
  obtenerDerivacionesProximasVencer(
    areaId: string,
    diasAnticipacion: number = 3
  ): Observable<Derivacion[]> {
    const params = new HttpParams().set(
      'dias_anticipacion',
      diasAnticipacion.toString()
    );

    return this.http.get<Derivacion[]>(
      `${this.apiUrl}/area/${areaId}/proximas-vencer`,
      { params }
    );
  }

  /**
   * Obtener derivaciones vencidas de un área
   * Requirements: 3.7, 8.2
   */
  obtenerDerivacionesVencidas(areaId: string): Observable<Derivacion[]> {
    return this.http.get<Derivacion[]>(
      `${this.apiUrl}/area/${areaId}/vencidas`
    );
  }

  /**
   * Cancelar una derivación
   * Requirements: 3.7
   */
  cancelarDerivacion(
    derivacionId: string,
    motivo: string
  ): Observable<Derivacion> {
    return this.http.post<Derivacion>(`${this.apiUrl}/${derivacionId}/cancelar`, {
      motivo
    });
  }

  /**
   * Reasignar una derivación a otra área
   * Requirements: 3.1, 3.2
   */
  reasignarDerivacion(
    derivacionId: string,
    nuevaAreaId: string,
    instrucciones: string
  ): Observable<Derivacion> {
    return this.http.post<Derivacion>(
      `${this.apiUrl}/${derivacionId}/reasignar`,
      {
        nueva_area_id: nuevaAreaId,
        instrucciones
      }
    );
  }
}
