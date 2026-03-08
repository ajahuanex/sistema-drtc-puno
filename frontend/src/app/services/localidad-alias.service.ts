import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LocalidadAlias,
  LocalidadAliasCreate,
  LocalidadAliasUpdate,
  BusquedaLocalidadResult,
  AliasEstadisticas
} from '../models/localidad-alias.model';

@Injectable({
  providedIn: 'root'
})
export class LocalidadAliasService {
  private apiUrl = `${environment.apiUrl}/localidades-alias`;

  constructor(private http: HttpClient) {}

  /**
   * Crear un nuevo alias
   */
  crearAlias(alias: LocalidadAliasCreate): Observable<LocalidadAlias> {
    return this.http.post<LocalidadAlias>(this.apiUrl, alias);
  }

  /**
   * Obtener todos los alias
   */
  obtenerAlias(skip: number = 0, limit: number = 100, soloActivos: boolean = true): Observable<LocalidadAlias[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString())
      .set('solo_activos', soloActivos.toString());

    return this.http.get<LocalidadAlias[]>(this.apiUrl, { params });
  }

  /**
   * Obtener alias por ID
   */
  obtenerAliasPorId(id: string): Observable<LocalidadAlias> {
    return this.http.get<LocalidadAlias>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar localidad por nombre o alias
   */
  buscarPorAlias(nombre: string): Observable<BusquedaLocalidadResult> {
    return this.http.get<BusquedaLocalidadResult>(`${this.apiUrl}/buscar/${encodeURIComponent(nombre)}`);
  }

  /**
   * Actualizar un alias
   */
  actualizarAlias(id: string, alias: LocalidadAliasUpdate): Observable<LocalidadAlias> {
    return this.http.put<LocalidadAlias>(`${this.apiUrl}/${id}`, alias);
  }

  /**
   * Eliminar (desactivar) un alias
   */
  eliminarAlias(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener alias más usados
   */
  obtenerAliasMasUsados(limit: number = 10): Observable<AliasEstadisticas[]> {
    let params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AliasEstadisticas[]>(`${this.apiUrl}/estadisticas/mas-usados`, { params });
  }

  /**
   * Obtener alias sin usar
   */
  obtenerAliasSinUsar(): Observable<LocalidadAlias[]> {
    return this.http.get<LocalidadAlias[]>(`${this.apiUrl}/estadisticas/sin-usar`);
  }
}
