import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ResolucionHija,
  ResolucionHijaCreate,
  ResolucionHijaUpdate,
  ResolucionHijaFiltros
} from '../models/resolucion-hija.model';

@Injectable({
  providedIn: 'root'
})
export class ResolucionHijaService {
  private apiUrl = `${environment.apiUrl}/resoluciones-hijas`;

  constructor(private http: HttpClient) {}

  getResolucionesHijas(filtros?: ResolucionHijaFiltros): Observable<ResolucionHija[]> {
    let params = new HttpParams().set('limit', '10000');
    if (filtros) {
      if (filtros.nro_resolucion) params = params.set('nro_resolucion', filtros.nro_resolucion);
      if (filtros.nro_resolucion_primigenia) params = params.set('nro_resolucion_primigenia', filtros.nro_resolucion_primigenia);
      if (filtros.ruc_empresa) params = params.set('ruc_empresa', filtros.ruc_empresa);
      if (filtros.tipo_acto) params = params.set('tipo_acto', filtros.tipo_acto);
    }
    return this.http.get<ResolucionHija[]>(this.apiUrl, { params });
  }

  getSiguienteNumero(tipoTramite?: string, anio?: number): Observable<{ siguiente_numero: string }> {
    let params = new HttpParams();
    if (tipoTramite) params = params.set('tipo_tramite', tipoTramite);
    if (anio) params = params.set('anio', anio.toString());
    return this.http.get<{ siguiente_numero: string }>(`${this.apiUrl}/siguiente-numero`, { params });
  }

  getHijaById(id: string): Observable<ResolucionHija> {
    return this.http.get<ResolucionHija>(`${this.apiUrl}/${id}`);
  }

  getHijaByNumero(nroResolucion: string): Observable<ResolucionHija> {
    return this.http.get<ResolucionHija>(`${this.apiUrl}/numero/${encodeURIComponent(nroResolucion)}`);
  }

  getHijasByPrimigenia(nroPrimigenia: string): Observable<ResolucionHija[]> {
    return this.http.get<ResolucionHija[]>(`${this.apiUrl}/primigenia/${nroPrimigenia}`);
  }

  getHijasByRuc(ruc: string): Observable<ResolucionHija[]> {
    return this.http.get<ResolucionHija[]>(`${this.apiUrl}/empresa/${ruc}`);
  }

  createResolucionHija(data: ResolucionHijaCreate): Observable<ResolucionHija> {
    return this.http.post<ResolucionHija>(this.apiUrl, data);
  }

  updateResolucionHija(id: string, data: ResolucionHijaUpdate): Observable<ResolucionHija> {
    return this.http.put<ResolucionHija>(`${this.apiUrl}/${id}`, data);
  }

  deleteResolucionHija(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkDeleteResolucionesHijas(ids: string[]): Observable<{ eliminados: number; mensaje: string }> {
    return this.http.post<{ eliminados: number; mensaje: string }>(`${this.apiUrl}/eliminar-masivo`, { ids });
  }

  descargarPlantillaExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/carga-masiva/plantilla`, {
      responseType: 'blob'
    });
  }

  procesarCargaMasiva(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<any>(`${this.apiUrl}/carga-masiva/procesar`, formData);
  }

  getVehiculosDetalleTramite(hijaId: string): Observable<{
    tramite_id: string;
    nro_resolucion: string;
    nro_resolucion_primigenia?: string;
    ruc_empresa: string;
    razon_social: string;
    expediente_numero?: string;
    fecha_resolucion?: string;
    observaciones?: string;
    vehiculos: Array<{
      placa: string;
      numero_tuc?: string;
      marca?: string;
      modelo?: string;
      anio_fabricacion?: number;
      categoria?: string;
      color?: string;
      carroceria?: string;
      modalidad?: string;
      vin?: string;
      motor?: string;
      asientos?: number;
      pasajeros?: number;
      combustible?: string;
      peso_seco?: number;
      peso_bruto?: number;
      carga_util?: number;
      rutas?: string[];
      es_saliente?: boolean;
      estado?: string;
    }>;
  }> {
    return this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(hijaId)}/vehiculos-detalle`);
  }

  editarTramiteCompleto(hijaId: string, payload: {
    nro_resolucion?: string;
    nro_resolucion_primigenia?: string;
    expediente_numero?: string;
    fecha_resolucion?: string;
    observaciones?: string;
    vehiculos: Array<{
      placa: string;
      numero_tuc?: string;
      marca?: string;
      modelo?: string;
      anio_fabricacion?: number;
      categoria?: string;
      color?: string;
      rutas?: string[];
      es_saliente?: boolean;
    }>;
  }): Observable<{ success: boolean; mensaje: string; tramite: any }> {
    return this.http.put<any>(`${this.apiUrl}/${encodeURIComponent(hijaId)}/editar-tramite`, payload);
  }
}
