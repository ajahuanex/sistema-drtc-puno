import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ParametroSistema, ParametroSistemaUpdate } from '../models/parametro.model';

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/parametros`;
  
  // Estado local para acceso síncrono en componentes si se necesita
  parametrosSignal = signal<ParametroSistema[]>([]);

  obtenerParametros(): Observable<ParametroSistema[]> {
    return this.http.get<ParametroSistema[]>(this.apiUrl).pipe(
      tap(parametros => this.parametrosSignal.set(parametros))
    );
  }

  actualizarParametro(id: string, updateData: ParametroSistemaUpdate): Observable<ParametroSistema> {
    return this.http.put<ParametroSistema>(`${this.apiUrl}/${id}`, updateData).pipe(
      tap(updatedParam => {
        const current = this.parametrosSignal();
        const index = current.findIndex(p => p.id === id);
        if (index !== -1) {
          const newParams = [...current];
          newParams[index] = updatedParam;
          this.parametrosSignal.set(newParams);
        }
      })
    );
  }

  // Helper para buscar un parámetro localmente
  getValor(clave: string, defaultValue: any = null): any {
    const parametro = this.parametrosSignal().find(p => p.clave === clave);
    return parametro ? parametro.valor : defaultValue;
  }
}
