import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ItemResultadoBusqueda {
  id: string;
  tipo: 'empresa' | 'vehiculo' | 'resolucion' | 'ruta' | 'conductor' | 'infraccion';
  titulo: string;
  subtitulo: string;
  icono: string;
  badge?: string;
  badgeColor?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  ruta: string;
  ruc?: string;
  placa?: string;
  dni?: string;
  nro_resolucion?: string;
  codigo_ruta?: string;
  data?: Record<string, any>;
}

export interface ResultadosBusquedaGlobal {
  empresas: ItemResultadoBusqueda[];
  vehiculos: ItemResultadoBusqueda[];
  resoluciones: ItemResultadoBusqueda[];
  rutas: ItemResultadoBusqueda[];
  conductores: ItemResultadoBusqueda[];
  infracciones: ItemResultadoBusqueda[];
}

export interface BusquedaGlobalResponse {
  query: string;
  total_coincidencias: number;
  resultados: ResultadosBusquedaGlobal;
}

@Injectable({
  providedIn: 'root'
})
export class BusquedaGlobalService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/busqueda-global`;

  buscar(query: string, limitPerCategory = 5): Observable<BusquedaGlobalResponse> {
    const params = new HttpParams()
      .set('q', query.trim())
      .set('limit_per_category', limitPerCategory.toString());

    return this.http.get<BusquedaGlobalResponse>(this.baseUrl, { params });
  }
}
