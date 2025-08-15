import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReporteConfig {
  tipo: TipoReporte;
  formato: FormatoReporte;
  filtros: ReporteFiltros;
  parametros?: any;
}

export interface ReporteFiltros {
  fechaDesde?: Date;
  fechaHasta?: Date;
  empresaId?: string;
  oficinaId?: string;
  estado?: string;
  tipo?: string;
  usuarioId?: string;
}

export enum TipoReporte {
  EXPEDIENTES = 'EXPEDIENTES',
  EMPRESAS = 'EMPRESAS',
  VEHICULOS = 'VEHICULOS',
  CONDUCTORES = 'CONDUCTORES',
  RUTAS = 'RUTAS',
  RESOLUCIONES = 'RESOLUCIONES',
  FISCALIZACIONES = 'FISCALIZACIONES',
  INFRAcciones = 'INFRACCIONES',
  ACTIVIDAD_USUARIOS = 'ACTIVIDAD_USUARIOS',
  ESTADISTICAS_GENERALES = 'ESTADISTICAS_GENERALES',
  FLUJO_EXPEDIENTES = 'FLUJO_EXPEDIENTES',
  AUDITORIA = 'AUDITORIA'
}

export enum FormatoReporte {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  HTML = 'HTML'
}

export interface ReporteResultado {
  id: string;
  nombre: string;
  tipo: TipoReporte;
  formato: FormatoReporte;
  urlDescarga: string;
  fechaGeneracion: Date;
  estado: EstadoReporte;
  tamanio: number;
  registros: number;
  errores?: string[];
}

export enum EstadoReporte {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADO = 'COMPLETADO',
  ERROR = 'ERROR',
  CANCELADO = 'CANCELADO'
}

export interface EstadisticaReporte {
  titulo: string;
  valor: number;
  unidad: string;
  cambio: number;
  cambioPorcentual: number;
  tendencia: 'ascendente' | 'descendente' | 'estable';
  color: string;
}

export interface GraficoReporte {
  tipo: 'linea' | 'barras' | 'pastel' | 'donut';
  titulo: string;
  datos: any[];
  opciones?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private http = inject(HttpClient);
      private baseUrl = `${environment.apiUrl}/api/v1/reportes`;

  /**
   * Genera un reporte basado en la configuración proporcionada
   */
  generarReporte(config: ReporteConfig): Observable<ReporteResultado> {
    return this.http.post<ReporteResultado>(`${this.baseUrl}/generar`, config);
  }

  /**
   * Obtiene el estado de un reporte en proceso
   */
  obtenerEstadoReporte(reporteId: string): Observable<ReporteResultado> {
    return this.http.get<ReporteResultado>(`${this.baseUrl}/${reporteId}/estado`);
  }

  /**
   * Descarga un reporte completado
   */
  descargarReporte(reporteId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${reporteId}/descargar`, { responseType: 'blob' });
  }

  /**
   * Obtiene la lista de reportes generados
   */
  obtenerReportesGenerados(filtros?: Partial<ReporteFiltros>): Observable<ReporteResultado[]> {
    const params = filtros ? this.construirParametros(filtros) : {};
    return this.http.get<ReporteResultado[]>(`${this.baseUrl}/generados`, { params });
  }

  /**
   * Cancela un reporte en proceso
   */
  cancelarReporte(reporteId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reporteId}`);
  }

  /**
   * Obtiene estadísticas para reportes
   */
  obtenerEstadisticas(tipo: TipoReporte, filtros?: ReporteFiltros): Observable<EstadisticaReporte[]> {
    const params = filtros ? this.construirParametros(filtros) : {};
    return this.http.get<EstadisticaReporte[]>(`${this.baseUrl}/estadisticas/${tipo}`, { params });
  }

  /**
   * Obtiene datos para gráficos
   */
  obtenerDatosGrafico(tipo: TipoReporte, grafico: GraficoReporte, filtros?: ReporteFiltros): Observable<any[]> {
    const params = {
      ...this.construirParametros(filtros || {}),
      tipoGrafico: grafico.tipo
    };
    return this.http.get<any[]>(`${this.baseUrl}/graficos/${tipo}`, { params });
  }

  /**
   * Genera reporte de expedientes
   */
  generarReporteExpedientes(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.EXPEDIENTES,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de empresas
   */
  generarReporteEmpresas(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.EMPRESAS,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de vehículos
   */
  generarReporteVehiculos(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.VEHICULOS,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de conductores
   */
  generarReporteConductores(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.CONDUCTORES,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de rutas
   */
  generarReporteRutas(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.RUTAS,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de resoluciones
   */
  generarReporteResoluciones(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.RESOLUCIONES,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de fiscalizaciones
   */
  generarReporteFiscalizaciones(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.FISCALIZACIONES,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de infracciones
   */
  generarReporteInfracciones(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.INFRAcciones,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de actividad de usuarios
   */
  generarReporteActividadUsuarios(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.ACTIVIDAD_USUARIOS,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de estadísticas generales
   */
  generarReporteEstadisticasGenerales(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.ESTADISTICAS_GENERALES,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de flujo de expedientes
   */
  generarReporteFlujoExpedientes(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.FLUJO_EXPEDIENTES,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte de auditoría
   */
  generarReporteAuditoria(filtros: ReporteFiltros, formato: FormatoReporte): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo: TipoReporte.AUDITORIA,
      formato,
      filtros
    });
  }

  /**
   * Genera reporte personalizado
   */
  generarReportePersonalizado(
    tipo: TipoReporte,
    formato: FormatoReporte,
    filtros: ReporteFiltros,
    parametros: any
  ): Observable<ReporteResultado> {
    return this.generarReporte({
      tipo,
      formato,
      filtros,
      parametros
    });
  }

  /**
   * Obtiene plantillas de reportes disponibles
   */
  obtenerPlantillasReporte(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/plantillas`);
  }

  /**
   * Guarda una plantilla de reporte personalizada
   */
  guardarPlantillaReporte(plantilla: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/plantillas`, plantilla);
  }

  /**
   * Programa la generación automática de reportes
   */
  programarReporteAutomatico(
    config: ReporteConfig,
    programacion: {
      frecuencia: 'diaria' | 'semanal' | 'mensual';
      hora?: string;
      diaSemana?: number;
      diaMes?: number;
      activo: boolean;
    }
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/programar`, { config, programacion });
  }

  /**
   * Obtiene reportes programados
   */
  obtenerReportesProgramados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/programados`);
  }

  /**
   * Actualiza la programación de un reporte
   */
  actualizarProgramacionReporte(reporteId: string, programacion: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/programados/${reporteId}`, programacion);
  }

  /**
   * Elimina la programación de un reporte
   */
  eliminarProgramacionReporte(reporteId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/programados/${reporteId}`);
  }

  /**
   * Obtiene el historial de reportes generados
   */
  obtenerHistorialReportes(filtros?: Partial<ReporteFiltros>): Observable<ReporteResultado[]> {
    const params = filtros ? this.construirParametros(filtros) : {};
    return this.http.get<ReporteResultado[]>(`${this.baseUrl}/historial`, { params });
  }

  /**
   * Obtiene métricas de rendimiento de reportes
   */
  obtenerMetricasRendimiento(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/metricas-rendimiento`);
  }

  /**
   * Valida la configuración de un reporte antes de generarlo
   */
  validarConfiguracionReporte(config: ReporteConfig): Observable<{ valido: boolean; errores: string[] }> {
    return this.http.post<{ valido: boolean; errores: string[] }>(`${this.baseUrl}/validar`, config);
  }

  /**
   * Obtiene vista previa de un reporte
   */
  obtenerVistaPrevia(config: ReporteConfig): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/vista-previa`, config);
  }

  /**
   * Construye parámetros de consulta para filtros
   */
  private construirParametros(filtros: Partial<ReporteFiltros>): any {
    const params: any = {};
    
    if (filtros.fechaDesde) {
      params.fechaDesde = filtros.fechaDesde.toISOString();
    }
    
    if (filtros.fechaHasta) {
      params.fechaHasta = filtros.fechaHasta.toISOString();
    }
    
    if (filtros.empresaId) {
      params.empresaId = filtros.empresaId;
    }
    
    if (filtros.oficinaId) {
      params.oficinaId = filtros.oficinaId;
    }
    
    if (filtros.estado) {
      params.estado = filtros.estado;
    }
    
    if (filtros.tipo) {
      params.tipo = filtros.tipo;
    }
    
    if (filtros.usuarioId) {
      params.usuarioId = filtros.usuarioId;
    }
    
    return params;
  }

  /**
   * Obtiene tipos de reporte disponibles
   */
  obtenerTiposReporte(): TipoReporte[] {
    return Object.values(TipoReporte);
  }

  /**
   * Obtiene formatos de reporte disponibles
   */
  obtenerFormatosReporte(): FormatoReporte[] {
    return Object.values(FormatoReporte);
  }

  /**
   * Obtiene estados de reporte disponibles
   */
  obtenerEstadosReporte(): EstadoReporte[] {
    return Object.values(EstadoReporte);
  }

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  formatearTamanioArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene el color del estado del reporte
   */
  obtenerColorEstado(estado: EstadoReporte): string {
    const colores: { [key in EstadoReporte]: string } = {
      [EstadoReporte.PENDIENTE]: '#ffc107',
      [EstadoReporte.EN_PROCESO]: '#17a2b8',
      [EstadoReporte.COMPLETADO]: '#28a745',
      [EstadoReporte.ERROR]: '#dc3545',
      [EstadoReporte.CANCELADO]: '#6c757d'
    };
    
    return colores[estado] || '#6c757d';
  }

  /**
   * Obtiene el icono del estado del reporte
   */
  obtenerIconoEstado(estado: EstadoReporte): string {
    const iconos: { [key in EstadoReporte]: string } = {
      [EstadoReporte.PENDIENTE]: 'schedule',
      [EstadoReporte.EN_PROCESO]: 'sync',
      [EstadoReporte.COMPLETADO]: 'check_circle',
      [EstadoReporte.ERROR]: 'error',
      [EstadoReporte.CANCELADO]: 'cancel'
    };
    
    return iconos[estado] || 'help';
  }
} 