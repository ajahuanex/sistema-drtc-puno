import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EntradaObservacion {
  texto: string;
  fecha?: string;
  fuente?: string;
  usuario?: string;
}

export interface VehiculoEmpresa {
  id: string;
  ruc: string;
  razon_social?: string;
  nro_resolucion_primigenia: string;
  fecha_emision_resolucion?: string;
  num_expediente?: string;
  expediente?: string;
  fecha_expediente?: string;
  nro_resolucion_hija?: string;
  tipo_resolucion_hija?: string;

  // 23 Especificaciones Técnicas del Vehículo:
  placa: string;
  marca?: string;
  modelo?: string;
  anio_fabricacion?: number;
  color?: string;
  categoria?: string;
  carroceria?: string;
  clase?: string;
  combustible?: string;
  numero_motor?: string;
  numero_serie?: string;
  vin?: string;
  pasajeros?: number;
  asientos?: number;
  cilindros?: number;
  ejes?: number;
  ruedas?: number;
  peso_bruto?: number;
  peso_neto?: number;
  carga_util?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
  observaciones?: string;

  es_cronologico: boolean;
  rutas: string[];
  numero_tuc?: string;
  estado?: string;
  observaciones_historial: EntradaObservacion[];
  fecha_cronologica?: string;
  fecha_resolucion_hija?: string;
  id_origen?: string;
  notificado?: string;
  estado_primigenia?: string;
  fecha_vigencia_hasta?: string;
  link_tuc?: string;
  link_notificacion?: string;
  detalles?: string;
  fecha_registro?: string;
  fecha_actualizacion?: string;
  esta_activo: boolean;
}

export interface FlotaEmpresaResponse {
  data: VehiculoEmpresa[];
  total: number;
  skip: number;
  limit: number;
}

export interface FlotaByEmpresaResponse {
  ruc: string;
  total: number;
  data: VehiculoEmpresa[];
}

export interface ResumenEmpresa {
  ruc: string;
  razon_social: string;
  total_vehiculos: number;
  habilitados: number;
  inhabilitados: number;
  primigenias: string[];
}

export interface EstadisticasFlota {
  ruc: string;
  total_registros: number;
  total_vehiculos_activos: number;
  por_estado: Record<string, number>;
  habilitados: number;
  inhabilitados: number;
  observados: number;
  cancelados: number;
  suspendidos: number;
}

export interface VehiculoEmpresaCreate {
  ruc: string;
  razon_social?: string;
  nro_resolucion_primigenia: string;
  fecha_emision_resolucion?: string;
  num_expediente?: string;
  fecha_expediente?: string;
  nro_resolucion_hija?: string;
  tipo_resolucion_hija?: string;

  // 23 Datos Técnicos del Vehículo:
  placa: string;
  marca?: string;
  modelo?: string;
  anio_fabricacion?: number;
  color?: string;
  categoria?: string;
  carroceria?: string;
  clase?: string;
  combustible?: string;
  numero_motor?: string;
  numero_serie?: string;
  vin?: string;
  pasajeros?: number;
  asientos?: number;
  cilindros?: number;
  ejes?: number;
  ruedas?: number;
  peso_bruto?: number;
  peso_neto?: number;
  carga_util?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
  observaciones?: string;

  es_cronologico?: boolean;
  rutas?: string[];
  numero_tuc?: string;
  estado?: string;
  observaciones_historial?: EntradaObservacion[];
  fecha_cronologica?: string;
  fecha_resolucion_hija?: string;
  id_origen?: string;
  notificado?: string;
  estado_primigenia?: string;
  link_tuc?: string;
  link_notificacion?: string;
  detalles?: string;
}

export interface CargaMasivaResultado {
  archivo: string;
  resultado: {
    total_filas: number;
    creados: number;
    actualizados: number;
    omitidos: number;
    errores: Array<{ fila: number; error: string }>;
    modo: string;
  };
  mensaje: string;
}

export interface PreviewResult {
  archivo: string;
  total_preview: number;
  validos: number;
  invalidos: number;
  preview: any[];
}

export interface ItemTramiteVehiculo {
  placa: string;
  placa_saliente?: string;
  rutas: string[];
  tipo_operacion?: string;
  datos_tecnicos?: Record<string, any>;
  observacion_custom?: string;
  numero_tuc?: string;
  dar_de_baja_otra_empresa?: boolean;
  orden?: number;
}

export interface TramiteMasivoRequest {
  ruc: string;
  razon_social?: string;
  nro_resolucion_primigenia: string;
  tipo_tramite: string;
  es_de_oficio?: boolean;
  documento_origen?: string;
  tipo_resolucion_hija?: string;
  num_expediente?: string;
  fecha_expediente?: string;
  nro_resolucion_hija?: string;
  fecha_emision_resolucion?: string;
  es_renovacion?: boolean;
  nueva_resolucion_primigenia?: string;
  nueva_fecha_emision?: string;
  nueva_fecha_inicio_vigencia?: string;
  nueva_fecha_fin_vigencia?: string;
  duracion_anios?: number;
  rutas_a_ratificar?: string[];
  nuevas_rutas?: string[];
  nuevas_rutas_detalle?: any[];
  cancelacion_total?: boolean;
  rutas_a_cancelar?: string[];
  datos_modificacion?: Record<string, any>;
  vehiculos: ItemTramiteVehiculo[];
}

@Injectable({
  providedIn: 'root'
})
export class FlotaEmpresaService {
  private baseUrl = `${environment.apiUrl}/flota-empresa`;
  private http = inject(HttpClient);

  procesarTramiteMasivo(payload: TramiteMasivoRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tramite-masivo`, payload);
  }

  procesarSustitucion(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sustitucion`, payload);
  }

  getFlotaPaginada(params: {
    skip?: number;
    limit?: number;
    ruc?: string;
    estado?: string;
    placa?: string;
    nro_resolucion_primigenia?: string;
    q?: string;
    solo_activos?: boolean;
  } = {}): Observable<FlotaEmpresaResponse> {
    let p = new HttpParams();
    if (params.skip !== undefined) p = p.set('skip', params.skip.toString());
    if (params.limit !== undefined) p = p.set('limit', params.limit.toString());
    if (params.ruc) p = p.set('ruc', params.ruc);
    if (params.estado) p = p.set('estado', params.estado);
    if (params.placa) p = p.set('placa', params.placa);
    if (params.nro_resolucion_primigenia) p = p.set('nro_resolucion_primigenia', params.nro_resolucion_primigenia);
    if (params.q) p = p.set('q', params.q);
    if (params.solo_activos) p = p.set('solo_activos', 'true');

    return this.http.get<FlotaEmpresaResponse>(this.baseUrl, { params: p });
  }

  getResumenEmpresas(): Observable<{ total: number; data: ResumenEmpresa[] }> {
    return this.http.get<{ total: number; data: ResumenEmpresa[] }>(`${this.baseUrl}/empresas-resumen`);
  }

  getFlotaByEmpresa(ruc: string, soloActivos = false): Observable<FlotaByEmpresaResponse> {
    let p = new HttpParams().set('solo_activos', soloActivos.toString());
    return this.http.get<FlotaByEmpresaResponse>(`${this.baseUrl}/empresa/${ruc}`, { params: p });
  }

  getEstadisticas(ruc: string): Observable<EstadisticasFlota> {
    return this.http.get<EstadisticasFlota>(`${this.baseUrl}/estadisticas/${ruc}`);
  }

  getRutasEmpresa(ruc: string): Observable<{ ruc: string; total: number; data: any[] }> {
    return this.http.get<{ ruc: string; total: number; data: any[] }>(`${this.baseUrl}/empresa/${ruc}/rutas`);
  }

  getCronologiaPrimigenia(nroPrimigenia: string): Observable<{ nro_resolucion_primigenia: string; total: number; data: VehiculoEmpresa[] }> {
    return this.http.get<any>(`${this.baseUrl}/cronologia/${encodeURIComponent(nroPrimigenia)}`);
  }

  getById(id: string): Observable<VehiculoEmpresa> {
    return this.http.get<VehiculoEmpresa>(`${this.baseUrl}/${id}`);
  }

  create(data: VehiculoEmpresaCreate): Observable<VehiculoEmpresa> {
    return this.http.post<VehiculoEmpresa>(this.baseUrl, data);
  }

  update(id: string, data: Partial<VehiculoEmpresa>): Observable<VehiculoEmpresa> {
    return this.http.put<VehiculoEmpresa>(`${this.baseUrl}/${id}`, data);
  }

  agregarObservacion(id: string, texto: string, fuente = 'manual'): Observable<VehiculoEmpresa> {
    return this.http.post<VehiculoEmpresa>(`${this.baseUrl}/${id}/observacion`, { texto, fuente });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Carga masiva
  validarArchivo(file: File, nFilas = 15): Observable<PreviewResult> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<PreviewResult>(`${this.baseUrl}/carga-masiva/validar?n_filas=${nFilas}`, formData);
  }

  procesarCargaMasiva(file: File, modo: 'upsert' | 'crear' = 'upsert'): Observable<CargaMasivaResultado> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<CargaMasivaResultado>(`${this.baseUrl}/carga-masiva/procesar?modo=${modo}`, formData);
  }

  descargarPlantilla(): void {
    window.open(`${this.baseUrl}/carga-masiva/plantilla`, '_blank');
  }
}
