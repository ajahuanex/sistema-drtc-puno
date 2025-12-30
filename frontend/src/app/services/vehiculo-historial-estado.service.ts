import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  VehiculoHistorialEstado, 
  VehiculoHistorialEstadoCreate, 
  VehiculoHistorialEstadoFilter 
} from '../models/vehiculo-historial-estado.model';

@Injectable({
  providedIn: 'root'
})
export class VehiculoHistorialEstadoService {
  private apiUrl = `${environment.apiUrl}/vehiculos-historial-estado`;

  constructor(private http: HttpClient) {}

  getHistorialEstados(filtros?: VehiculoHistorialEstadoFilter): Observable<VehiculoHistorialEstado[]> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.vehiculoId) params = params.set('vehiculoId', filtros.vehiculoId);
      if (filtros.vehiculoPlaca) params = params.set('vehiculoPlaca', filtros.vehiculoPlaca);
      if (filtros.estadoAnterior) params = params.set('estadoAnterior', filtros.estadoAnterior);
      if (filtros.estadoNuevo) params = params.set('estadoNuevo', filtros.estadoNuevo);
      if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde.toISOString());
      if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta.toISOString());
      if (filtros.usuarioId) params = params.set('usuarioId', filtros.usuarioId);
    }

    return this.http.get<VehiculoHistorialEstado[]>(this.apiUrl, { params });
  }

  getHistorialEstadosByVehiculo(vehiculoId: string): Observable<VehiculoHistorialEstado[]> {
    return this.getHistorialEstados({ vehiculoId });
  }

  crearHistorialEstado(historial: VehiculoHistorialEstadoCreate): Observable<VehiculoHistorialEstado> {
    return this.http.post<VehiculoHistorialEstado>(this.apiUrl, historial);
  }

  getHistorialEstadoById(id: string): Observable<VehiculoHistorialEstado> {
    return this.http.get<VehiculoHistorialEstado>(`${this.apiUrl}/${id}`);
  }
}