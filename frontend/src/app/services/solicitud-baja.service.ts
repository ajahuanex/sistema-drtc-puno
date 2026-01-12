import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { 
  SolicitudBaja, 
  SolicitudBajaCreate, 
  SolicitudBajaUpdate, 
  SolicitudBajaFilter 
} from '../models/solicitud-baja.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitudBajaService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Crear una nueva solicitud de baja
   */
  crearSolicitudBaja(solicitud: SolicitudBajaCreate): Observable<SolicitudBaja> {
    return this.http.post<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja`, solicitud, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creando solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener todas las solicitudes de baja con filtros
   */
  getSolicitudesBaja(filtros?: SolicitudBajaFilter): Observable<SolicitudBaja[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.estado?.length) {
        params = params.set('estado', filtros.estado.join(','));
      }
      if (filtros.motivo?.length) {
        params = params.set('motivo', filtros.motivo.join(','));
      }
      if (filtros.fechaDesde) {
        params = params.set('fechaDesde', filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        params = params.set('fechaHasta', filtros.fechaHasta);
      }
      if (filtros.empresaId) {
        params = params.set('empresaId', filtros.empresaId);
      }
      if (filtros.vehiculoPlaca) {
        params = params.set('vehiculoPlaca', filtros.vehiculoPlaca);
      }
      if (filtros.solicitadoPor) {
        params = params.set('solicitadoPor', filtros.solicitadoPor);
      }
    }

    return this.http.get<SolicitudBaja[]>(`${this.apiUrl}/solicitudes-baja`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo solicitudes de baja:', error);
        return of([]); // Devolver array vacío en caso de error
      })
    );
  }

  /**
   * Obtener una solicitud de baja por ID
   */
  getSolicitudBaja(id: string): Observable<SolicitudBaja> {
    return this.http.get<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar una solicitud de baja
   */
  actualizarSolicitudBaja(id: string, actualizacion: SolicitudBajaUpdate): Observable<SolicitudBaja> {
    return this.http.put<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja/${id}`, actualizacion, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error actualizando solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener solicitudes de baja por vehículo
   */
  getSolicitudesBajaPorVehiculo(vehiculoId: string): Observable<SolicitudBaja[]> {
    return this.http.get<SolicitudBaja[]>(`${this.apiUrl}/solicitudes-baja/vehiculo/${vehiculoId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo solicitudes por vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aprobar una solicitud de baja
   */
  aprobarSolicitudBaja(id: string): Observable<SolicitudBaja> {
    return this.http.put<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja/${id}/aprobar`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error aprobando solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Rechazar una solicitud de baja
   */
  rechazarSolicitudBaja(id: string, observaciones: string): Observable<SolicitudBaja> {
    return this.http.put<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja/${id}/rechazar`, 
      { observaciones }, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error rechazando solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancelar una solicitud de baja
   */
  cancelarSolicitudBaja(id: string): Observable<SolicitudBaja> {
    return this.http.put<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja/${id}/cancelar`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error cancelando solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }
}