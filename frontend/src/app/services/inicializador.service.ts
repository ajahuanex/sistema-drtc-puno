import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EtapaInicializador {
  id: 'empresas' | 'resoluciones' | 'rutas' | 'vehiculos' | 'matriz';
  nombre: string;
  coleccion: string;
  total_registros: number;
  default_url: string;
  completado: boolean;
  descripcion: string;
}

export interface EstadoInicializadorResponse {
  success: boolean;
  default_urls: Record<string, string>;
  etapas: EtapaInicializador[];
}

export interface PreviewResponse {
  success: boolean;
  etapa: string;
  total_filas: number;
  total_columnas: number;
  columnas: string[];
  muestra: Record<string, any>[];
}

export interface EjecutarResponse {
  success: boolean;
  etapa: string;
  mensaje: string;
  resultado: any;
}

@Injectable({
  providedIn: 'root'
})
export class InicializadorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inicializador`;

  obtenerEstado(): Observable<EstadoInicializadorResponse> {
    return this.http.get<EstadoInicializadorResponse>(`${this.apiUrl}/estado`);
  }

  previsualizarGoogleSheet(etapa: string, url: string): Observable<PreviewResponse> {
    return this.http.post<PreviewResponse>(`${this.apiUrl}/preview`, { etapa, url });
  }

  previsualizarArchivo(etapa: string, file: File): Observable<PreviewResponse> {
    const formData = new FormData();
    formData.append('etapa', etapa);
    formData.append('file', file);
    return this.http.post<PreviewResponse>(`${this.apiUrl}/preview-file`, formData);
  }

  ejecutarGoogleSheet(etapa: string, url: string): Observable<EjecutarResponse> {
    return this.http.post<EjecutarResponse>(`${this.apiUrl}/ejecutar`, { etapa, url });
  }

  ejecutarArchivo(etapa: string, file: File): Observable<EjecutarResponse> {
    const formData = new FormData();
    formData.append('etapa', etapa);
    formData.append('file', file);
    return this.http.post<EjecutarResponse>(`${this.apiUrl}/ejecutar-file`, formData);
  }

  limpiarTodoExceptoUsuarios(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/limpiar-todo-excepto-usuarios`, {});
  }
}
