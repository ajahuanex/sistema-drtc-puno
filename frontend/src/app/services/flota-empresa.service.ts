import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
  anio_modelo?: number;
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
  baja?: string;
  baja_externa?: string;
  fecha_vigencia_hasta?: string;
  link_tuc?: string;
  id_tuc?: string;
  link_notificacion?: string;
  tramite?: string;
  detalles?: string;
  porcentaje?: string;
  orden_cronologico?: number;
  fila_origen_matriz?: number;
  fecha_registro?: string;
  fecha_actualizacion?: string;
  esta_activo: boolean;

  // Compatibilidad dual con serializaciones camelCase
  nroResolucionPrimigenia?: string;
  nroResolucionHija?: string;
  tipoResolucionHija?: string;
  numeroTuc?: string;
  linkTuc?: string;
  linkNotificacion?: string;
  esCronologico?: boolean;
  estadoPrimigenia?: string;
  fechaVigenciaHasta?: string;
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
  estado?: string;
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
  renovaciones?: number;
  sustituciones?: number;
  incrementos?: number;
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
  anio_modelo?: number;
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
  otra_empresa_ruc?: string;
  otra_empresa_razon?: string;
  baja_tipo?: 'INTERNA' | 'EXTERNA' | 'NINGUNA';
  baja_externa?: {
    empresa_origen?: string;
    ruc_empresa_origen?: string;
    resolucion_baja?: string;
    ambito?: string;
    fecha_baja?: string;
    evidencia_nombre?: string;
    evidencia_tamano?: string;
    evidencia_tipo?: string;
    evidencia_base64?: string;
  };
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

export function normalizeVehiculo(v: any): VehiculoEmpresa {
  if (!v) return v;
  return {
    id: v.id || v._id,
    ruc: v.ruc,
    razon_social: v.razon_social ?? v.razonSocial,
    nro_resolucion_primigenia: v.nro_resolucion_primigenia ?? v.nroResolucionPrimigenia ?? '',
    fecha_emision_resolucion: v.fecha_emision_resolucion ?? v.fechaEmisionResolucion,
    num_expediente: v.num_expediente ?? v.numExpediente,
    expediente: v.expediente ?? v.num_expediente ?? v.numExpediente,
    fecha_expediente: v.fecha_expediente ?? v.fechaExpediente,
    nro_resolucion_hija: v.nro_resolucion_hija ?? v.nroResolucionHija,
    tipo_resolucion_hija: v.tipo_resolucion_hija ?? v.tipoResolucionHija,

    placa: v.placa ?? '-',
    marca: v.marca,
    modelo: v.modelo,
    anio_fabricacion: v.anio_fabricacion ?? v.anioFabricacion,
    anio_modelo: v.anio_modelo ?? v.anioModelo,
    color: v.color,
    categoria: v.categoria,
    carroceria: v.carroceria,
    clase: v.clase,
    combustible: v.combustible,
    numero_motor: v.numero_motor ?? v.numeroMotor,
    numero_serie: v.numero_serie ?? v.numeroSerie,
    vin: v.vin,
    pasajeros: v.pasajeros,
    asientos: v.asientos,
    cilindros: v.cilindros,
    ejes: v.ejes,
    ruedas: v.ruedas,
    peso_bruto: v.peso_bruto ?? v.pesoBruto,
    peso_neto: v.peso_neto ?? v.pesoNeto,
    carga_util: v.carga_util ?? v.cargaUtil,
    largo: v.largo,
    ancho: v.ancho,
    alto: v.alto,
    observaciones: v.observaciones,

    es_cronologico: v.es_cronologico ?? v.esCronologico ?? false,
    rutas: Array.isArray(v.rutas) ? v.rutas : [],
    numero_tuc: v.numero_tuc ?? v.numeroTuc,
    estado: v.estado,
    observaciones_historial: v.observaciones_historial ?? v.observacionesHistorial ?? [],
    fecha_cronologica: v.fecha_cronologica ?? v.fechaCronologica,
    fecha_resolucion_hija: v.fecha_resolucion_hija ?? v.fechaResolucionHija,
    id_origen: v.id_origen ?? v.idOrigen,
    notificado: v.notificado,
    estado_primigenia: v.estado_primigenia ?? v.estadoPrimigenia,
    baja: v.baja,
    baja_externa: v.baja_externa ?? v.bajaExterna,
    fecha_vigencia_hasta: v.fecha_vigencia_hasta ?? v.fechaVigenciaHasta,
    link_tuc: v.link_tuc ?? v.linkTuc,
    id_tuc: v.id_tuc ?? v.idTuc,
    link_notificacion: v.link_notificacion ?? v.linkNotificacion,
    tramite: v.tramite,
    detalles: v.detalles,
    porcentaje: v.porcentaje,
    orden_cronologico: v.orden_cronologico ?? v.ordenCronologico,
    fila_origen_matriz: v.fila_origen_matriz ?? v.filaOrigenMatriz,
    fecha_registro: v.fecha_registro ?? v.fechaRegistro,
    fecha_actualizacion: v.fecha_actualizacion ?? v.fechaActualizacion,
    esta_activo: v.esta_activo ?? v.estaActivo ?? true,

    // Aliases camelCase
    nroResolucionPrimigenia: v.nro_resolucion_primigenia ?? v.nroResolucionPrimigenia,
    nroResolucionHija: v.nro_resolucion_hija ?? v.nroResolucionHija,
    tipoResolucionHija: v.tipo_resolucion_hija ?? v.tipoResolucionHija,
    numeroTuc: v.numero_tuc ?? v.numeroTuc,
    linkTuc: v.link_tuc ?? v.linkTuc,
    linkNotificacion: v.link_notificacion ?? v.linkNotificacion,
    esCronologico: v.es_cronologico ?? v.esCronologico ?? false,
    estadoPrimigenia: v.estado_primigenia ?? v.estadoPrimigenia,
    fechaVigenciaHasta: v.fecha_vigencia_hasta ?? v.fechaVigenciaHasta
  } as VehiculoEmpresa;
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

  validarSustitucion(ruc: string, placaSaliente: string, placaEntrante: string, nroResolucion?: string): Observable<any> {
    let p = new HttpParams()
      .set('ruc', ruc)
      .set('placa_saliente', placaSaliente)
      .set('placa_entrante', placaEntrante);
    if (nroResolucion) p = p.set('nro_resolucion', nroResolucion);
    return this.http.get<any>(`${this.baseUrl}/validar-sustitucion`, { params: p });
  }

  verificarPlacaTramite(placa: string, rucActual?: string): Observable<any> {
    let p = new HttpParams();
    if (rucActual) p = p.set('ruc_actual', rucActual);
    return this.http.get<any>(`${this.baseUrl}/verificar-placa-tramite/${encodeURIComponent(placa)}`, { params: p });
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

    return this.http.get<FlotaEmpresaResponse>(this.baseUrl, { params: p }).pipe(
      map(resp => ({
        ...resp,
        data: (resp.data || []).map(normalizeVehiculo)
      }))
    );
  }

  getResumenEmpresas(): Observable<{ total: number; data: ResumenEmpresa[] }> {
    return this.http.get<{ total: number; data: ResumenEmpresa[] }>(`${this.baseUrl}/empresas-resumen`);
  }

  getFlotaByEmpresa(ruc: string, soloActivos = false): Observable<FlotaByEmpresaResponse> {
    let p = new HttpParams().set('solo_activos', soloActivos.toString());
    return this.http.get<FlotaByEmpresaResponse>(`${this.baseUrl}/empresa/${ruc}`, { params: p }).pipe(
      map(resp => ({
        ...resp,
        data: (resp.data || []).map(normalizeVehiculo)
      }))
    );
  }

  getEstadisticas(ruc: string): Observable<EstadisticasFlota> {
    return this.http.get<any>(`${this.baseUrl}/estadisticas/${ruc}`).pipe(
      map(stats => ({
        ruc: stats.ruc,
        total_registros: stats.total_registros ?? stats.totalRegistros ?? 0,
        total_vehiculos_activos: stats.total_vehiculos_activos ?? stats.total_activos ?? stats.total_habilitados ?? 0,
        por_estado: stats.por_estado ?? stats.porEstado ?? {},
        habilitados: stats.habilitados ?? stats.total_habilitados ?? stats.total_activos ?? 0,
        inhabilitados: stats.inhabilitados ?? stats.total_inhabilitados ?? 0,
        observados: stats.observados ?? 0,
        cancelados: stats.cancelados ?? 0,
        suspendidos: stats.suspendidos ?? 0,
        renovaciones: stats.renovaciones ?? 0,
        sustituciones: stats.sustituciones ?? 0,
        incrementos: stats.incrementos ?? 0
      }))
    );
  }

  getRutasEmpresa(ruc: string): Observable<{ ruc: string; total: number; data: any[] }> {
    return this.http.get<{ ruc: string; total: number; data: any[] }>(`${this.baseUrl}/empresa/${ruc}/rutas`);
  }

  getCronologiaPrimigenia(nroPrimigenia: string): Observable<{ nro_resolucion_primigenia: string; total: number; data: VehiculoEmpresa[] }> {
    return this.http.get<any>(`${this.baseUrl}/cronologia/${encodeURIComponent(nroPrimigenia)}`).pipe(
      map(resp => ({
        ...resp,
        data: (resp.data || []).map(normalizeVehiculo)
      }))
    );
  }

  getById(id: string): Observable<VehiculoEmpresa> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(normalizeVehiculo)
    );
  }

  create(data: VehiculoEmpresaCreate): Observable<VehiculoEmpresa> {
    return this.http.post<any>(this.baseUrl, data).pipe(
      map(normalizeVehiculo)
    );
  }

  update(id: string, data: Partial<VehiculoEmpresa>): Observable<VehiculoEmpresa> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data).pipe(
      map(normalizeVehiculo)
    );
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
