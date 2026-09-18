import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmpresaModalidad {
  modalidad: string;
  total: number;
}

export interface RutaEmpresas {
  nombre: string;
  totalEmpresas: number;
}

export interface FlotaEmpresa {
  ruc: string;
  razonSocial: string;
  total: number;
}

export interface DashboardEstadisticas {
  empresasPorModalidad: EmpresaModalidad[];
  rutasHabilitadasTotal: number;
  rutasConMasEmpresas: RutaEmpresas[];
  resolucionesPrimigeniasAutorizadas: number;
  totalSustituciones: number;
  totalIncrementos: number;
  totalFlotaHabilitada: number;
  topFlotasPorEmpresa: FlotaEmpresa[];
}

export interface ReporteResponse {
  success: boolean;
  message: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  getEstadisticas(): Observable<DashboardEstadisticas> {
    return this.http.get<DashboardEstadisticas>(`${this.apiUrl}/estadisticas`);
  }

  generarReporte(): Observable<ReporteResponse> {
    return this.http.post<ReporteResponse>(`${this.apiUrl}/generar-reporte`, {});
  }
}
