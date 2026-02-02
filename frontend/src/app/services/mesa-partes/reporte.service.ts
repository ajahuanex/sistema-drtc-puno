import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Estadisticas,
  EstadisticasPorArea,
  EstadisticasPorTipo,
  MetricasRendimiento,
  FiltrosReporte,
  ConfiguracionReporte,
  Reporte,
  TipoReporte,
  FormatoExportacion,
  PeriodoReporte,
  ResultadoExportacion
} from '../../models/mesa-partes/reporte.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  /**
   * Obtener estadísticas generales
   * Requirements: 6.1
   */
  obtenerEstadisticas(filtros?: FiltrosReporte): Observable<Estadisticas> {
    let params = this.construirParams(filtros);

    return this.http.get<Estadisticas>(`${this.apiUrl}/estadisticas`, {
      params
    });
  }

  /**
   * Obtener estadísticas por área
   * Requirements: 6.1, 6.3
   */
  obtenerEstadisticasPorArea(
    filtros?: FiltrosReporte
  ): Observable<EstadisticasPorArea[]> {
    let params = this.construirParams(filtros);

    return this.http.get<EstadisticasPorArea[]>(
      `${this.apiUrl}/estadisticas/por-area`,
      { params }
    );
  }

  /**
   * Obtener estadísticas por tipo de documento
   * Requirements: 6.1, 6.2
   */
  obtenerEstadisticasPorTipo(
    filtros?: FiltrosReporte
  ): Observable<EstadisticasPorTipo[]> {
    let params = this.construirParams(filtros);

    return this.http.get<EstadisticasPorTipo[]>(
      `${this.apiUrl}/estadisticas/por-tipo`,
      { params }
    );
  }

  /**
   * Obtener métricas de rendimiento
   * Requirements: 6.1, 6.5
   */
  obtenerMetricas(filtros?: FiltrosReporte): Observable<MetricasRendimiento> {
    let params = this.construirParams(filtros);

    return this.http.get<MetricasRendimiento>(`${this.apiUrl}/metricas`, {
      params
    });
  }

  /**
   * Generar reporte personalizado
   * Requirements: 6.2, 6.3, 6.4
   */
  generarReporte(configuracion: ConfiguracionReporte): Observable<Reporte> {
    return this.http.post<Reporte>(`${this.apiUrl}/generar`, configuracion);
  }

  /**
   * Exportar reporte a formato específico
   * Requirements: 6.4
   */
  exportarReporte(
    reporteId: string,
    formato: FormatoExportacion
  ): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reporteId}/exportar/${formato}`, {
      responseType: 'blob'
    });
  }

  /**
   * Exportar estadísticas a Excel
   * Requirements: 6.4
   */
  exportarExcel(filtros?: FiltrosReporte): Observable<Blob> {
    let params = this.construirParams(filtros);

    return this.http.get(`${this.apiUrl}/exportar/excel`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Exportar estadísticas a PDF
   * Requirements: 6.4
   */
  exportarPDF(filtros?: FiltrosReporte): Observable<Blob> {
    let params = this.construirParams(filtros);

    return this.http.get(`${this.apiUrl}/exportar/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Descargar reporte exportado
   * Requirements: 6.4
   */
  descargarReporte(
    reporteId: string,
    formato: FormatoExportacion,
    nombreArchivo?: string
  ): void {
    this.exportarReporte(reporteId, formato).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const extension = formato.toLowerCase();
        const nombre =
          nombreArchivo || `reporte_${reporteId}_${Date.now()}.${extension}`;
        link.download = nombre;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar reporte::', error);
      }
    });
  }

  /**
   * Obtener documentos vencidos
   * Requirements: 6.6
   */
  obtenerDocumentosVencidos(
    areaId?: string,
    page?: number,
    pageSize?: number
  ): Observable<{
    documentos: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams();

    if (areaId) {
      params = params.set('area_id', areaId);
    }
    if (typeof page !== "undefined") {
      params = params.set('page', page.toString());
    }
    if (typeof pageSize !== "undefined") {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<{
      documentos: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`${this.apiUrl}/documentos-vencidos`, { params });
  }

  /**
   * Obtener documentos próximos a vencer
   * Requirements: 6.6
   */
  obtenerDocumentosProximosVencer(
    diasAnticipacion: number = 3,
    areaId?: string,
    page?: number,
    pageSize?: number
  ): Observable<{
    documentos: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams().set(
      'dias_anticipacion',
      diasAnticipacion.toString()
    );

    if (areaId) {
      params = params.set('area_id', areaId);
    }
    if (typeof page !== "undefined") {
      params = params.set('page', page.toString());
    }
    if (typeof pageSize !== "undefined") {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<{
      documentos: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`${this.apiUrl}/documentos-proximos-vencer`, { params });
  }

  /**
   * Obtener documentos urgentes
   * Requirements: 8.3
   */
  obtenerDocumentosUrgentes(
    areaId?: string,
    page?: number,
    pageSize?: number
  ): Observable<any[]> {
    let params = new HttpParams();

    if (areaId) {
      params = params.set('area_id', areaId);
    }
    if (typeof page !== "undefined") {
      params = params.set('page', page.toString());
    }
    if (typeof pageSize !== "undefined") {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<any[]>(`${this.apiUrl}/documentos-urgentes`, { params });
  }

  /**
   * Obtener tiempos promedio de atención por área
   * Requirements: 6.5
   */
  obtenerTiemposAtencionPorArea(
    filtros?: FiltrosReporte
  ): Observable<{
    areaId: string;
    areaNombre: string;
    tiempoPromedio: number;
    tiempoMinimo: number;
    tiempoMaximo: number;
  }[]> {
    let params = this.construirParams(filtros);

    return this.http.get<
      {
        areaId: string;
        areaNombre: string;
        tiempoPromedio: number;
        tiempoMinimo: number;
        tiempoMaximo: number;
      }[]
    >(`${this.apiUrl}/tiempos-atencion/por-area`, { params });
  }

  /**
   * Obtener tendencias de documentos
   * Requirements: 6.2
   */
  obtenerTendencias(
    periodo: PeriodoReporte,
    agruparPor: 'dia' | 'semana' | 'mes' = 'dia'
  ): Observable<{
    fecha: Date;
    recibidos: number;
    atendidos: number;
    pendientes: number;
  }[]> {
    const params = new HttpParams()
      .set('periodo', periodo)
      .set('agrupar_por', agruparPor);

    return this.http.get<
      {
        fecha: Date;
        recibidos: number;
        atendidos: number;
        pendientes: number;
      }[]
    >(`${this.apiUrl}/tendencias`, { params });
  }

  /**
   * Obtener reportes guardados
   * Requirements: 6.7
   */
  obtenerReportesGuardados(
    page?: number,
    pageSize?: number
  ): Observable<{
    reportes: Reporte[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams();

    if (typeof page !== "undefined") {
      params = params.set('page', page.toString());
    }
    if (typeof pageSize !== "undefined") {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<{
      reportes: Reporte[];
      total: number;
      page: number;
      pageSize: number;
    }>(`${this.apiUrl}/guardados`, { params });
  }

  /**
   * Guardar configuración de reporte
   * Requirements: 6.7
   */
  guardarConfiguracionReporte(
    configuracion: ConfiguracionReporte
  ): Observable<Reporte> {
    return this.http.post<Reporte>(`${this.apiUrl}/guardar`, configuracion);
  }

  /**
   * Eliminar reporte guardado
   * Requirements: 6.7
   */
  eliminarReporte(reporteId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reporteId}`);
  }

  /**
   * Obtener estadísticas de integraciones
   * Requirements: 4.5, 4.6
   */
  obtenerEstadisticasIntegraciones(
    filtros?: FiltrosReporte
  ): Observable<{
    integracionId: string;
    integracionNombre: string;
    documentosEnviados: number;
    documentosRecibidos: number;
    exitosos: number;
    fallidos: number;
    ultimaSincronizacion?: Date;
  }[]> {
    let params = this.construirParams(filtros);

    return this.http.get<
      {
        integracionId: string;
        integracionNombre: string;
        documentosEnviados: number;
        documentosRecibidos: number;
        exitosos: number;
        fallidos: number;
        ultimaSincronizacion?: Date;
      }[]
    >(`${this.apiUrl}/estadisticas/integraciones`, { params });
  }

  /**
   * Programar generación automática de reporte
   * Requirements: 6.7
   */
  programarReporteAutomatico(
    configuracion: ConfiguracionReporte,
    frecuencia: 'diaria' | 'semanal' | 'mensual',
    destinatarios: string[]
  ): Observable<{
    id: string;
    mensaje: string;
  }> {
    return this.http.post<{
      id: string;
      mensaje: string;
    }>(`${this.apiUrl}/programar`, {
      configuracion,
      frecuencia,
      destinatarios
    });
  }

  /**
   * Construir parámetros HTTP desde filtros
   * Helper privado
   */
  private construirParams(filtros?: FiltrosReporte): HttpParams {
    let params = new HttpParams();

    if (!filtros) {
      return params;
    }

    if (filtros.fechaDesde) {
      params = params.set('fecha_desde', filtros.fechaDesde.toISOString());
    }
    if (filtros.fechaHasta) {
      params = params.set('fecha_hasta', filtros.fechaHasta.toISOString());
    }
    if (filtros.periodo) {
      params = params.set('periodo', filtros.periodo);
    }
    if (filtros.areaId) {
      params = params.set('area_id', filtros.areaId);
    }
    if (filtros.tipoDocumentoId) {
      params = params.set('tipo_documento_id', filtros.tipoDocumentoId);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.prioridad) {
      params = params.set('prioridad', filtros.prioridad);
    }
    if (filtros.usuarioId) {
      params = params.set('usuario_id', filtros.usuarioId);
    }

    return params;
  }
}
