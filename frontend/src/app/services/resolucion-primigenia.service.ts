import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ResolucionPrimigenia,
  ResolucionPrimigeniaCreate,
  ResolucionPrimigeniaUpdate,
  ResolucionPrimigeniaFiltros,
  FeErrata,
  ModificacionHistorial
} from '../models/resolucion-primigenia.model';

@Injectable({
  providedIn: 'root'
})
export class ResolucionPrimigeniaService {
  private apiUrl = `${environment.apiUrl}/resoluciones-primigenias`;

  constructor(private http: HttpClient) {}

  getResolucionesPrimigenias(filtros?: ResolucionPrimigeniaFiltros): Observable<ResolucionPrimigenia[]> {
    let params = new HttpParams().set('limit', '10000');
    if (filtros) {
      if (filtros.ruc_empresa) params = params.set('ruc_empresa', filtros.ruc_empresa);
      if (filtros.nro_resolucion) params = params.set('nro_resolucion', filtros.nro_resolucion);
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.tipo_autorizacion) params = params.set('tipo_autorizacion', filtros.tipo_autorizacion);
    }
    return this.http.get<ResolucionPrimigenia[]>(this.apiUrl, { params });
  }

  getResolucionById(id: string): Observable<ResolucionPrimigenia> {
    return this.http.get<ResolucionPrimigenia>(`${this.apiUrl}/${id}`);
  }

  getResolucionByNumero(numero: string): Observable<ResolucionPrimigenia> {
    return this.http.get<ResolucionPrimigenia>(`${this.apiUrl}/numero/${numero}`);
  }

  getResolucionesByRuc(ruc: string): Observable<ResolucionPrimigenia[]> {
    return this.http.get<ResolucionPrimigenia[]>(`${this.apiUrl}/empresa/${ruc}`);
  }

  createResolucionPrimigenia(data: ResolucionPrimigeniaCreate): Observable<ResolucionPrimigenia> {
    return this.http.post<ResolucionPrimigenia>(this.apiUrl, data);
  }

  updateResolucionPrimigenia(id: string, data: ResolucionPrimigeniaUpdate): Observable<ResolucionPrimigenia> {
    return this.http.put<ResolucionPrimigenia>(`${this.apiUrl}/${id}`, data);
  }

  agregarFeErrata(id: string, feErrata: FeErrata): Observable<ResolucionPrimigenia> {
    return this.http.post<ResolucionPrimigenia>(`${this.apiUrl}/${id}/fe-erratas`, feErrata);
  }

  agregarModificacionHistorial(id: string, modificacion: ModificacionHistorial): Observable<ResolucionPrimigenia> {
    return this.http.post<ResolucionPrimigenia>(`${this.apiUrl}/${id}/historial-modificaciones`, modificacion);
  }

  deleteResolucionPrimigenia(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  descargarPlantillaExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/carga-masiva/plantilla`, {
      responseType: 'blob'
    });
  }

  procesarCargaMasiva(file: File, modo: string = 'upsert'): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file);
    const params = new HttpParams().set('modo', modo);
    return this.http.post<any>(`${this.apiUrl}/carga-masiva/procesar`, formData, { params });
  }
}
