import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  private normalizeResolucion(r: any): ResolucionPrimigenia {
    if (!r) return r;
    return {
      ...r,
      id: r.id || r._id,
      ruc_empresa: r.ruc_empresa ?? r.rucEmpresa ?? '',
      rucEmpresa: r.rucEmpresa ?? r.ruc_empresa ?? '',
      razon_social: r.razon_social ?? r.razonSocial ?? '',
      razonSocial: r.razonSocial ?? r.razon_social ?? '',
      nro_resolucion: r.nro_resolucion ?? r.nroResolucion ?? '',
      nroResolucion: r.nroResolucion ?? r.nro_resolucion ?? '',
      siglas: r.siglas ?? '',
      fecha_resolucion: r.fecha_resolucion ?? r.fechaResolucion ?? r.fecha_emision ?? r.fechaEmision,
      fechaResolucion: r.fechaResolucion ?? r.fecha_resolucion ?? r.fecha_emision ?? r.fechaEmision,
      fecha_inicio_vigencia: r.fecha_inicio_vigencia ?? r.fechaInicioVigencia,
      fechaInicioVigencia: r.fechaInicioVigencia ?? r.fecha_inicio_vigencia,
      anios_vigencia: r.anios_vigencia ?? r.aniosVigencia ?? 10,
      aniosVigencia: r.aniosVigencia ?? r.anios_vigencia ?? 10,
      fecha_fin_vigencia: r.fecha_fin_vigencia ?? r.fechaFinVigencia,
      fechaFinVigencia: r.fechaFinVigencia ?? r.fecha_fin_vigencia,
      estado: r.estado ?? 'VIGENTE',
      tiene_eficacia_anticipada: r.tiene_eficacia_anticipada ?? r.tieneEficaciaAnticipada ?? false,
      tieneEficaciaAnticipada: r.tieneEficaciaAnticipada ?? r.tiene_eficacia_anticipada ?? false,
      tipo_autorizacion: r.tipo_autorizacion ?? r.tipoAutorizacion ?? 'PASAJEROS',
      tipoAutorizacion: r.tipoAutorizacion ?? r.tipo_autorizacion ?? 'PASAJEROS',
      modalidad: r.modalidad ?? '',
      link_documento: r.link_documento ?? r.linkDocumento ?? '',
      linkDocumento: r.linkDocumento ?? r.link_documento ?? '',
      expedientes_codigos: r.expedientes_codigos ?? r.expedientesCodigos ?? [],
      expedientesCodigos: r.expedientesCodigos ?? r.expedientes_codigos ?? [],
      rutas_autorizadas_ids: r.rutas_autorizadas_ids ?? r.rutasAutorizadasIds ?? [],
      rutasAutorizadasIds: r.rutasAutorizadasIds ?? r.rutas_autorizadas_ids ?? [],
      fe_erratas: r.fe_erratas ?? r.feErratas ?? [],
      feErratas: r.feErratas ?? r.fe_erratas ?? [],
      historial_modificaciones: r.historial_modificaciones ?? r.historialModificaciones ?? [],
      historialModificaciones: r.historialModificaciones ?? r.historial_modificaciones ?? [],
      observaciones: r.observaciones ?? '',
      esta_activo: r.esta_activo ?? r.estaActivo ?? true
    };
  }

  getResolucionesPrimigenias(filtros?: ResolucionPrimigeniaFiltros): Observable<ResolucionPrimigenia[]> {
    let params = new HttpParams().set('limit', '10000');
    if (filtros) {
      if (filtros.ruc_empresa) params = params.set('ruc_empresa', filtros.ruc_empresa);
      if (filtros.nro_resolucion) params = params.set('nro_resolucion', filtros.nro_resolucion);
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.tipo_autorizacion) params = params.set('tipo_autorizacion', filtros.tipo_autorizacion);
    }
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(items => items.map(item => this.normalizeResolucion(item)))
    );
  }

  getResolucionById(id: string): Observable<ResolucionPrimigenia> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizeResolucion(item))
    );
  }

  getResolucionByNumero(numero: string): Observable<ResolucionPrimigenia> {
    return this.http.get<any>(`${this.apiUrl}/numero/${numero}`).pipe(
      map(item => this.normalizeResolucion(item))
    );
  }

  getResolucionesByRuc(ruc: string): Observable<ResolucionPrimigenia[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empresa/${ruc}`).pipe(
      map(items => items.map(item => this.normalizeResolucion(item)))
    );
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
