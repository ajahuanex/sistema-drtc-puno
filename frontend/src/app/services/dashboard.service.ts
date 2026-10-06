import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface CategoriaVehicularItem {
  categoria: string;
  total: number;
  porcentaje: number;
}

export interface EstadisticasCategoria {
  total: number;
  m2: number;
  m3: number;
  otras: number;
  porcentajeM2: number;
  porcentajeM3: number;
  porcentajeOtras: number;
  detalle: CategoriaVehicularItem[];
}

export interface EstadisticasPermanencia {
  total: number;
  optimo: number;
  proximoRetiro: number;
  regimenExtraordinarioPuno: number;
  vencidoExcedido: number;
  noDeterminado: number;
  edadPromedio: number;
  salidaPunoDetalle: Record<string, number>;
  limiteOrdinarioAnios: number;
  limiteExtraordinarioAnios: number;
  porcentajeOptimo: number;
  porcentajeProximo: number;
  porcentajeExtraordinario: number;
  porcentajeVencido: number;
}

export interface EstadisticasVigenciaTuc {
  total: number;
  totalHabilitados?: number;
  vigentes: number;
  anuladasBajas: number;
  electronicas: number;
  fisicas: number;
  porcentajeDigital: number;
}

export interface NormativaMtc {
  normaOrdinaria: string;
  normaPuno: string;
  normaClasificacion: string;
  unidadesCriticasSalida2026: number;
  condicionCitv: string;
  tramitePredominante: string;
}

export interface EstadisticasCasilla {
  totalEmpresas: number;
  empresasConCasilla: number;
  empresasSinCasilla: number;
  porcentajeConCasilla: number;
  ultimaVerificacion?: string | null;
  empresasSinCasillaLista?: {
    ruc: string;
    razonSocial: string;
    emailContacto?: string;
    telefonoContacto?: string;
  }[];
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
  estadisticasCategoria?: EstadisticasCategoria;
  estadisticasPermanencia?: EstadisticasPermanencia;
  estadisticasVigenciaTuc?: EstadisticasVigenciaTuc;
  normativaMtc?: NormativaMtc;
  estadisticasCasilla?: EstadisticasCasilla;
}

export interface DetallePermanenciaVehiculo {
  numero: number;
  placa: string;
  ruc: string;
  razonSocial: string;
  categoria: string;
  marca: string;
  modelo: string;
  anioFabricacion: number | null;
  edadAnios: number | null;
  estadoPermanencia: string;
  situacion: string;
  norma: string;
  anioRetiro: number | null;
  accion: string;
  badgeColor: string;
  nroTuc: string;
  nroResolucion: string;
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

  getReporteDetallePermanencia(params?: {
    estado_permanencia?: string;
    categoria?: string;
    ruc?: string;
    search?: string;
  }): Observable<DetallePermanenciaVehiculo[]> {
    let httpParams = new HttpParams();
    if (params?.estado_permanencia) httpParams = httpParams.set('estado_permanencia', params.estado_permanencia);
    if (params?.categoria) httpParams = httpParams.set('categoria', params.categoria);
    if (params?.ruc) httpParams = httpParams.set('ruc', params.ruc);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<DetallePermanenciaVehiculo[]>(`${this.apiUrl}/reporte-detalle/permanencia`, { params: httpParams });
  }

  generarReporte(): Observable<ReporteResponse> {
    return this.http.post<ReporteResponse>(`${this.apiUrl}/generar-reporte`, {});
  }
}
