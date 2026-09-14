import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VehiculoDataPreviewResponse {
  valido: boolean;
  total: number;
  correctos: number;
  errores: number;
  filas: {
    fila: number;
    placa: string;
    estado: 'OK' | 'ERROR';
    mensaje: string;
    datos: any;
  }[];
  error?: string;
}

export interface VehiculoDataEjecutarResponse {
  exito: boolean;
  insertados: number;
  actualizados: number;
  errores: number;
  total_procesados: number;
  detalles_errores: { placa: string; error: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoDataService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl || 'http://localhost:8000/api/v1'}/vehiculos-data`;

  getVehiculosData(skip: number = 0, limit: number = 1000, marca?: string, categoria?: string, q?: string): Observable<{ success: boolean; data: any[]; total: number }> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    if (marca) params = params.set('marca', marca);
    if (categoria) params = params.set('categoria', categoria);
    if (q) params = params.set('q', q);

    return this.http.get<{ success: boolean; data: any[]; total: number }>(this.apiUrl, { params });
  }

  getVehiculoDataById(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/${id}`);
  }

  getVehiculoDataByPlaca(placa: string): Observable<{ success: boolean; data: any; message?: string }> {
    return this.http.get<{ success: boolean; data: any; message?: string }>(`${this.apiUrl}/buscar/placa/${placa}`);
  }

  createVehiculoData(data: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(this.apiUrl, data);
  }

  updateVehiculoData(id: string, data: any): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.apiUrl}/${id}`, data);
  }

  deleteVehiculoData(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  previewFile(file: File): Observable<{ success: boolean; data: VehiculoDataPreviewResponse }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: VehiculoDataPreviewResponse }>(
      `${this.apiUrl}/carga-masiva-preview-file`,
      formData
    );
  }

  previewUrl(url: string): Observable<{ success: boolean; data: VehiculoDataPreviewResponse }> {
    return this.http.post<{ success: boolean; data: VehiculoDataPreviewResponse }>(
      `${this.apiUrl}/carga-masiva-preview-url`,
      { url }
    );
  }

  ejecutarCargaMasiva(filas: any[]): Observable<{ success: boolean; data: VehiculoDataEjecutarResponse }> {
    return this.http.post<{ success: boolean; data: VehiculoDataEjecutarResponse }>(
      `${this.apiUrl}/carga-masiva-ejecutar`,
      { filas }
    );
  }
}
