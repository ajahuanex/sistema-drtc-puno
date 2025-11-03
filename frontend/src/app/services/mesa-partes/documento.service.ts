import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Documento,
  DocumentoCreate,
  DocumentoUpdate,
  FiltrosDocumento,
  ArchivoAdjunto
} from '../../models/mesa-partes/documento.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v1/documentos';

  /**
   * Crear un nuevo documento
   * Requirements: 1.1, 1.2
   */
  crearDocumento(documento: DocumentoCreate): Observable<Documento> {
    return this.http.post<Documento>(this.apiUrl, documento);
  }

  /**
   * Obtener un documento por ID
   * Requirements: 1.1, 5.4
   */
  obtenerDocumento(id: string): Observable<Documento> {
    return this.http.get<Documento>(`${this.apiUrl}/${id}`);
  }

  /**
   * Listar documentos con filtros y paginación
   * Requirements: 5.1, 5.2, 5.3
   */
  listarDocumentos(filtros?: FiltrosDocumento): Observable<{
    documentos: Documento[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.estado) {
        params = params.set('estado', filtros.estado);
      }
      if (filtros.tipoDocumentoId) {
        params = params.set('tipo_documento_id', filtros.tipoDocumentoId);
      }
      if (filtros.prioridad) {
        params = params.set('prioridad', filtros.prioridad);
      }
      if (filtros.fechaDesde) {
        params = params.set('fecha_desde', filtros.fechaDesde.toISOString());
      }
      if (filtros.fechaHasta) {
        params = params.set('fecha_hasta', filtros.fechaHasta.toISOString());
      }
      if (filtros.remitente) {
        params = params.set('remitente', filtros.remitente);
      }
      if (filtros.asunto) {
        params = params.set('asunto', filtros.asunto);
      }
      if (filtros.numeroExpediente) {
        params = params.set('numero_expediente', filtros.numeroExpediente);
      }
      if (filtros.areaActualId) {
        params = params.set('area_actual_id', filtros.areaActualId);
      }
      if (filtros.page !== undefined) {
        params = params.set('page', filtros.page.toString());
      }
      if (filtros.pageSize !== undefined) {
        params = params.set('page_size', filtros.pageSize.toString());
      }
    }

    return this.http.get<{
      documentos: Documento[];
      total: number;
      page: number;
      pageSize: number;
    }>(this.apiUrl, { params });
  }

  /**
   * Actualizar un documento existente
   * Requirements: 1.4
   */
  actualizarDocumento(id: string, datos: DocumentoUpdate): Observable<Documento> {
    return this.http.put<Documento>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Archivar un documento
   * Requirements: 9.1, 9.2, 9.3
   */
  archivarDocumento(id: string, clasificacion: string): Observable<Documento> {
    return this.http.post<Documento>(`${this.apiUrl}/${id}/archivar`, {
      clasificacion
    });
  }

  /**
   * Adjuntar archivo a un documento
   * Requirements: 1.3
   */
  adjuntarArchivo(documentoId: string, archivo: File): Observable<ArchivoAdjunto> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<ArchivoAdjunto>(
      `${this.apiUrl}/${documentoId}/archivos`,
      formData
    );
  }

  /**
   * Generar comprobante de recepción en PDF
   * Requirements: 1.6, 1.7
   */
  generarComprobante(documentoId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentoId}/comprobante`, {
      responseType: 'blob'
    });
  }

  /**
   * Descargar comprobante de recepción
   * Requirements: 1.6, 1.7
   */
  descargarComprobante(documentoId: string, numeroExpediente: string): void {
    this.generarComprobante(documentoId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante_${numeroExpediente}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar comprobante:', error);
      }
    });
  }

  /**
   * Buscar documento por código QR
   * Requirements: 5.7
   */
  buscarPorQR(codigoQR: string): Observable<Documento> {
    return this.http.get<Documento>(`${this.apiUrl}/qr/${codigoQR}`);
  }

  /**
   * Obtener tipos de documento disponibles
   * Requirements: 2.1
   */
  obtenerTiposDocumento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipos`);
  }

  /**
   * Eliminar un documento (soft delete)
   * Requirements: 1.4
   */
  eliminarDocumento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Restaurar un documento archivado
   * Requirements: 9.5
   */
  restaurarDocumento(id: string): Observable<Documento> {
    return this.http.post<Documento>(`${this.apiUrl}/${id}/restaurar`, {});
  }

  /**
   * Exportar lista de documentos a Excel
   * Requirements: 5.6
   */
  exportarExcel(filtros?: FiltrosDocumento): Observable<Blob> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.tipoDocumentoId) params = params.set('tipo_documento_id', filtros.tipoDocumentoId);
      if (filtros.fechaDesde) params = params.set('fecha_desde', filtros.fechaDesde.toISOString());
      if (filtros.fechaHasta) params = params.set('fecha_hasta', filtros.fechaHasta.toISOString());
    }

    return this.http.get(`${this.apiUrl}/exportar/excel`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Exportar lista de documentos a PDF
   * Requirements: 5.6
   */
  exportarPDF(filtros?: FiltrosDocumento): Observable<Blob> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.tipoDocumentoId) params = params.set('tipo_documento_id', filtros.tipoDocumentoId);
      if (filtros.fechaDesde) params = params.set('fecha_desde', filtros.fechaDesde.toISOString());
      if (filtros.fechaHasta) params = params.set('fecha_hasta', filtros.fechaHasta.toISOString());
    }

    return this.http.get(`${this.apiUrl}/exportar/pdf`, {
      params,
      responseType: 'blob'
    });
  }
}
