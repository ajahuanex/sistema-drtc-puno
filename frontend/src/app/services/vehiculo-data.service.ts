/**
 * Servicio para gestión de VehiculoData (Datos Técnicos Puros)
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  VehiculoData,
  VehiculoDataCreate,
  VehiculoDataUpdate,
  VehiculoDataResumen
} from '../models/vehiculo-data.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoDataService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vehiculos-data`;

  /**
   * Crear registro de datos técnicos
   */
  createVehiculoData(data: VehiculoDataCreate): Observable<VehiculoData> {
    return this.http.post<ApiResponse<VehiculoData>>(this.apiUrl, data).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener datos técnicos por ID
   */
  getVehiculoData(id: string): Observable<VehiculoData> {
    return this.http.get<ApiResponse<VehiculoData>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Buscar datos técnicos por placa
   */
  buscarPorPlaca(placa: string): Observable<VehiculoData | null> {
    return this.http.get<ApiResponse<VehiculoData | null>>(
      `${this.apiUrl}/buscar/placa/${placa}`
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Buscar datos técnicos por VIN
   */
  buscarPorVin(vin: string): Observable<VehiculoData | null> {
    return this.http.get<ApiResponse<VehiculoData | null>>(
      `${this.apiUrl}/buscar/vin/${vin}`
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar datos técnicos
   */
  updateVehiculoData(id: string, data: VehiculoDataUpdate): Observable<VehiculoData> {
    return this.http.put<ApiResponse<VehiculoData>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar datos técnicos
   */
  deleteVehiculoData(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Listar datos técnicos con filtros
   */
  listVehiculosData(
    skip: number = 0,
    limit: number = 100,
    marca?: string,
    categoria?: string
  ): Observable<{ data: VehiculoData[], total: number }> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (marca) {
      params = params.set('marca', marca);
    }

    if (categoria) {
      params = params.set('categoria', categoria);
    }

    return this.http.get<ApiListResponse<VehiculoData>>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.data,
        total: response.total
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Validar si una placa ya existe
   */
  validarPlacaExistente(placa: string): Observable<boolean> {
    return this.buscarPorPlaca(placa).pipe(
      map(vehiculoData => vehiculoData !== null)
    );
  }

  /**
   * Validar si un VIN ya existe
   */
  validarVinExistente(vin: string): Observable<boolean> {
    return this.buscarPorVin(vin).pipe(
      map(vehiculoData => vehiculoData !== null)
    );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.detail || error.message || 'Error en el servidor';
    }

    console.error('❌ [VehiculoDataService] Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
