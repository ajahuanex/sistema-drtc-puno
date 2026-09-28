import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TramiteAdministrativoPayload {
  ruc_empresa: string;
  razon_social?: string;
  ambito: 'EMPRESA' | 'CONCESION';
  tipo_tramite: 'CAMBIO_REPRESENTANTE' | 'CAMBIO_DOMICILIO' | 'MODIFICACION_RUTA' | 'MODIFICACION_FRECUENCIA' | 'FE_DE_ERRATAS' | 'REACTIVACION_JUDICIAL';
  nro_resolucion: string;
  fecha_resolucion?: string;
  nro_expediente?: string;
  fecha_expediente?: string;
  nro_resolucion_primigenia?: string;
  detalles: Record<string, any>;
  link_documento?: string;
  link_notificacion?: string;
  observaciones?: string;
  usuario?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TramiteAdministrativoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tramites-administrativos`;

  listarTramites(filtros: { ruc?: string; ambito?: string; tipo_tramite?: string; resolucion?: string; skip?: number; limit?: number } = {}): Observable<any> {
    let params = new HttpParams();
    if (filtros.ruc) params = params.set('ruc', filtros.ruc);
    if (filtros.ambito) params = params.set('ambito', filtros.ambito);
    if (filtros.tipo_tramite) params = params.set('tipo_tramite', filtros.tipo_tramite);
    if (filtros.resolucion) params = params.set('resolucion', filtros.resolucion);
    if (filtros.skip !== undefined) params = params.set('skip', filtros.skip.toString());
    if (filtros.limit !== undefined) params = params.set('limit', filtros.limit.toString());
    return this.http.get<any>(this.apiUrl, { params });
  }

  obtenerTramite(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  registrarTramite(payload: TramiteAdministrativoPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}
