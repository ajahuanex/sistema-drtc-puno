import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RutaEmpresas {
  nombre: string;
  totalEmpresas: number;
}

export interface FlotaEmpresa {
  ruc: string;
  razonSocial: string;
  total: number;
}

export interface FlotaCorredor {
  corredor: string;
  origen: string;
  destino: string;
  totalVehiculos: number;
  totalEmpresas: number;
  empresas: string[];
}

export interface EmpresasPorResolucionesResumen {
  con1: number;
  con2: number;
  con3: number;
  con4: number;
  con5Mas: number;
  totalEmpresas: number;
}

export interface EmpresaMultiResolucionItem {
  ruc: string;
  razonSocial: string;
  totalResoluciones: number;
  resoluciones: string[];
}

export interface ResolucionVencerItem {
  nroResolucion: string;
  ruc: string;
  razonSocial: string;
  fechaFinVigencia: string;
  diasRestantes: number;
}

export interface ResolucionesVencerResumen {
  total: number;
  items: ResolucionVencerItem[];
}

export interface EmpresaTramiteItem {
  ranking?: number;
  ruc: string;
  razonSocial: string;
  sustituciones: number;
  incrementos: number;
  totalTramites: number;
}

export interface DashboardEstadisticas {
  rutasHabilitadasTotal: number;
  rutasConMasEmpresas: RutaEmpresas[];
  resolucionesPrimigeniasAutorizadas: number;
  resolucionesPorVencer30?: ResolucionesVencerResumen;
  resolucionesPorVencer60?: ResolucionesVencerResumen;
  totalSustituciones: number;
  totalIncrementos: number;
  totalTramitesFlota?: number;
  topEmpresasTramites?: EmpresaTramiteItem[];
  totalFlotaHabilitada: number;
  topFlotasPorEmpresa: FlotaEmpresa[];
  flotasPorCorredor: FlotaCorredor[];
  empresasPorResoluciones: EmpresasPorResolucionesResumen;
  detalleEmpresasMultiResolucion: EmpresaMultiResolucionItem[];
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

  getReporteDetalleRutas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reporte-detalle/rutas`);
  }

  getReporteDetalleResoluciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reporte-detalle/resoluciones`);
  }

  getReporteDetalleFlota(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reporte-detalle/flota`);
  }

  getReporteDetalleTramites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reporte-detalle/tramites`);
  }

  getReporteDetallePorVencer(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reporte-detalle/por-vencer`);
  }

  generarReporte(): Observable<ReporteResponse> {
    return this.http.post<ReporteResponse>(`${this.apiUrl}/generar-reporte`, {});
  }
}
