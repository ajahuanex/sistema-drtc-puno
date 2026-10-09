import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  private normalizeHija(r: any): ResolucionHija {
    if (!r) return r;
    return {
      ...r,
      id: r.id || r._id,
      nro_resolucion: r.nro_resolucion ?? r.nroResolucion ?? '',
      nroResolucion: r.nroResolucion ?? r.nro_resolucion ?? '',
      siglas: r.siglas ?? '',
      nro_resolucion_primigenia: r.nro_resolucion_primigenia ?? r.nroResolucionPrimigenia ?? '',
      nroResolucionPrimigenia: r.nroResolucionPrimigenia ?? r.nro_resolucion_primigenia ?? '',
      resolucion_primigenia_id: r.resolucion_primigenia_id ?? r.resolucionPrimigeniaId,
      resolucionPrimigeniaId: r.resolucionPrimigeniaId ?? r.resolucion_primigenia_id,
      ruc_empresa: r.ruc_empresa ?? r.rucEmpresa ?? '',
      rucEmpresa: r.rucEmpresa ?? r.ruc_empresa ?? '',
      razon_social: r.razon_social ?? r.razonSocial ?? '',
      razonSocial: r.razonSocial ?? r.razon_social ?? '',
      tipo_acto: r.tipo_acto ?? r.tipoActo ?? 'OTROS',
      tipoActo: r.tipoActo ?? r.tipo_acto ?? 'OTROS',
      fecha_resolucion: r.fecha_resolucion ?? r.fechaResolucion,
      fechaResolucion: r.fechaResolucion ?? r.fecha_resolucion,
      fecha_inicio_efectos: r.fecha_inicio_efectos ?? r.fechaInicioEfectos,
      fechaInicioEfectos: r.fechaInicioEfectos ?? r.fecha_inicio_efectos,
      expediente_numero: r.expediente_numero ?? r.expedienteNumero ?? '',
      expedienteNumero: r.expedienteNumero ?? r.expediente_numero ?? '',
      fecha_expediente: r.fecha_expediente ?? r.fechaExpediente,
      fechaExpediente: r.fechaExpediente ?? r.fecha_expediente,
      link_documento: r.link_documento ?? r.linkDocumento ?? '',
      linkDocumento: r.linkDocumento ?? r.link_documento ?? '',
      link_notificacion: r.link_notificacion ?? r.linkNotificacion ?? '',
      linkNotificacion: r.linkNotificacion ?? r.link_notificacion ?? '',
      vehiculos_ingresantes: r.vehiculos_ingresantes ?? r.vehiculosIngresantes ?? [],
      vehiculosIngresantes: r.vehiculosIngresantes ?? r.vehiculos_ingresantes ?? [],
      vehiculos_salientes: r.vehiculos_salientes ?? r.vehiculosSalientes ?? [],
      vehiculosSalientes: r.vehiculosSalientes ?? r.vehiculos_salientes ?? [],
      rutas_modificadas_ids: r.rutas_modificadas_ids ?? r.rutasModificadasIds ?? [],
      rutasModificadasIds: r.rutasModificadasIds ?? r.rutas_modificadas_ids ?? [],
      numeros_tuc: r.numeros_tuc ?? r.numerosTuc ?? [],
      numerosTuc: r.numerosTuc ?? r.numeros_tuc ?? [],
      tucs_baja: r.tucs_baja ?? r.tucsBaja ?? [],
      tucsBaja: r.tucsBaja ?? r.tucs_baja ?? [],
      observaciones: r.observaciones ?? '',
      esta_activo: r.esta_activo ?? r.estaActivo ?? true
    };
  }

  getResolucionesHijas(filtros?: ResolucionHijaFiltros): Observable<ResolucionHija[]> {
    let params = new HttpParams().set('limit', '10000');
    if (filtros) {
      if (filtros.nro_resolucion) params = params.set('nro_resolucion', filtros.nro_resolucion);
      if (filtros.nro_resolucion_primigenia) params = params.set('nro_resolucion_primigenia', filtros.nro_resolucion_primigenia);
      if (filtros.ruc_empresa) params = params.set('ruc_empresa', filtros.ruc_empresa);
      if (filtros.tipo_acto) params = params.set('tipo_acto', filtros.tipo_acto);
    }
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(items => items.map(item => this.normalizeHija(item)))
    );
  }

  getSiguienteNumero(tipoTramite?: string, anio?: number): Observable<{ siguiente_numero: string }> {
    let params = new HttpParams();
    if (tipoTramite) params = params.set('tipo_tramite', tipoTramite);
    if (anio) params = params.set('anio', anio.toString());
    return this.http.get<{ siguiente_numero: string }>(`${this.apiUrl}/siguiente-numero`, { params });
  }

  getHijaById(id: string): Observable<ResolucionHija> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizeHija(item))
    );
  }

  getHijaByNumero(nroResolucion: string): Observable<ResolucionHija> {
    return this.http.get<any>(`${this.apiUrl}/numero/${encodeURIComponent(nroResolucion)}`).pipe(
      map(item => this.normalizeHija(item))
    );
  }

  getHijasByPrimigenia(nroPrimigenia: string): Observable<ResolucionHija[]> {
    return this.http.get<any[]>(`${this.apiUrl}/primigenia/${nroPrimigenia}`).pipe(
      map(items => items.map(item => this.normalizeHija(item)))
    );
  }

  getHijasByRuc(ruc: string): Observable<ResolucionHija[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empresa/${ruc}`).pipe(
      map(items => items.map(item => this.normalizeHija(item)))
    );
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
