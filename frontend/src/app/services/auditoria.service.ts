import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LogAuditoria,
  AuditoriaKPIs,
  AuditoriaRespuestaPaginada,
  FiltrosAuditoria
} from '../models/auditoria.model';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auditoria`;

  getLogs(filtros: FiltrosAuditoria = {}): Observable<AuditoriaRespuestaPaginada> {
    let params = new HttpParams();
    if (filtros.modulo && filtros.modulo !== 'TODOS') params = params.set('modulo', filtros.modulo);
    if (filtros.accion && filtros.accion !== 'TODOS') params = params.set('accion', filtros.accion);
    if (filtros.severidad && filtros.severidad !== 'TODAS') params = params.set('severidad', filtros.severidad);
    if (filtros.q && filtros.q.trim()) params = params.set('q', filtros.q.trim());
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.pageSize) params = params.set('pageSize', filtros.pageSize.toString());

    return this.http.get<AuditoriaRespuestaPaginada>(this.apiUrl, { params });
  }

  getKpis(): Observable<AuditoriaKPIs> {
    return this.http.get<AuditoriaKPIs>(`${this.apiUrl}/kpis`);
  }

  getLogDetalle(id: string): Observable<LogAuditoria> {
    return this.http.get<LogAuditoria>(`${this.apiUrl}/${id}`);
  }

  exportarDatos(filtros: FiltrosAuditoria = {}, limite = 2500): Observable<LogAuditoria[]> {
    let params = new HttpParams().set('limite', limite.toString());
    if (filtros.modulo && filtros.modulo !== 'TODOS') params = params.set('modulo', filtros.modulo);
    if (filtros.accion && filtros.accion !== 'TODOS') params = params.set('accion', filtros.accion);
    if (filtros.severidad && filtros.severidad !== 'TODAS') params = params.set('severidad', filtros.severidad);
    if (filtros.q && filtros.q.trim()) params = params.set('q', filtros.q.trim());
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);

    return this.http.get<LogAuditoria[]>(`${this.apiUrl}/exportar-datos`, { params });
  }

  sincronizarHistorial(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sincronizar`, {});
  }
}
