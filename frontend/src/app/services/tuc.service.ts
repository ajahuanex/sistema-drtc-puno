import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Tuc,
  TucCreateRequest,
  TucDuplicadoRequest,
  TucKardexStock,
  TucVerificacionPublica,
  TucEstadisticas,
  TipoEmisionTuc,
  EstadoTuc
} from '../models/tuc.model';

export interface TucPlantillaConfig {
  plantilla_id: string;
  carpeta_destino_id?: string;
  auto_detectar_margen?: boolean;
  col_margen_izq?: number;
  col_codigo?: number;
  col_tramo?: number;
  col_frecuencia?: number;
  col_margen_der?: number;
  fuente_tamanio_codigo?: number;
  fuente_tamanio_tramo?: number;
  fuente_tamanio_frecuencia?: number;
  fuente_tamanio_dias?: number;
}

export interface GoogleDocsStatus {
  disponible: boolean;
  mensaje: string;
  credentials_file?: string;
  plantilla_id?: string;
  configuracion?: TucPlantillaConfig;
}

export interface VariablePlantillaTuc {
  id: string;
  tag: string;
  label: string;
  categoria: 'autorizacion' | 'vehiculo' | 'rutas' | 'acto_reverso' | 'personalizado' | 'imagen' | 'qr';
  seccion: 'anverso' | 'reverso';
  tipo?: 'texto' | 'imagen' | 'qr' | 'linea';
  imagen_url?: string;
  qr_contenido?: string;
  opacidad?: number;
  x_mm: number;
  y_mm: number;
  width_mm?: number;
  height_mm?: number;
  grosor_mm?: number;
  estilo_linea?: 'solid' | 'dashed' | 'dotted';
  font_size_pt?: number;
  font_weight?: 'normal' | 'bold';
  color: string;
  align?: 'left' | 'center' | 'right';
  visible: boolean;
  bloqueado?: boolean;
  prefix?: string;
  prefix_font_weight?: 'normal' | 'bold';
  prefix_font_size_pt?: number;
  suffix?: string;
  suffix_font_weight?: 'normal' | 'bold';
  suffix_font_size_pt?: number;
  line_height?: number; // Espacio entre líneas por defecto muy cortito (ej: 1.05)
  es_dinamica?: boolean;
  valor_ejemplo?: string;
  etiqueta?: string;
  etiqueta_font_weight?: 'normal' | 'bold';
  etiqueta_color?: string;
  etiqueta_font_size_pt?: number;
  max_lineas?: number;
  resaltar_comillas?: boolean;
  orientacion_texto?: 'horizontal' | 'vertical' | 'vertical_270';
  rotacion?: number;
  imprimible?: boolean;
}

export interface LineaHorizontalConfig {
  activa: boolean;
  y_mm: number;
  x_mm?: number;
  ancho_mm: number;
  grosor_mm: number;
  color: string;
  estilo: 'solid' | 'dashed' | 'dotted';
  imprimible: boolean;
  etiqueta?: string;
}

export interface PlantillaTucCalibradorConfig {
  _id?: string;
  id?: string;
  nombre: string;
  descripcion?: string;
  formato_papel?: 'DUAL_PVC' | 'A4';
  orientacion?: 'portrait' | 'landscape';
  modo_hojas?: 'UNA_HOJA' | 'DOS_HOJAS';
  ancho_mm: number;
  alto_mm: number;
  anverso_alto_mm: number;
  reverso_alto_mm: number;
  margen_izq_mm: number;
  margen_der_mm: number;
  margen_top_mm?: number;
  margen_bottom_mm?: number;
  linea_horizontal?: LineaHorizontalConfig;
  variables: VariablePlantillaTuc[];
  activa?: boolean;
  es_oficial?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface PlantillaTucResumen {
  _id: string;
  id: string;
  nombre: string;
  descripcion?: string;
  formato_papel: 'DUAL_PVC' | 'A4';
  orientacion: 'portrait' | 'landscape';
  modo_hojas: 'UNA_HOJA' | 'DOS_HOJAS';
  ancho_mm: number;
  alto_mm: number;
  total_variables: number;
  activa: boolean;
  es_oficial?: boolean;
  fecha_actualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TucService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tucs`;

  // Signals para estado reactivo
  tucsSignal = signal<Tuc[]>([]);
  totalTucsSignal = signal<number>(0);
  estadisticasSignal = signal<TucEstadisticas | null>(null);
  loadingSignal = signal<boolean>(false);

  // Listar TUCs con filtros
  getTucs(filtros?: {
    q?: string;
    nroTuc?: string;
    placa?: string;
    ruc?: string;
    razonSocial?: string;
    nroResolucion?: string;
    nroExpediente?: string;
    tipoTramite?: string;
    tipoEmision?: TipoEmisionTuc | '';
    estado?: EstadoTuc | '';
    skip?: number;
    limit?: number;
  }): Observable<{ total: number; skip: number; limit: number; items: Tuc[] }> {
    this.loadingSignal.set(true);
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.q) params = params.set('q', filtros.q.trim());
      if (filtros.nroTuc) params = params.set('nroTuc', filtros.nroTuc.trim());
      if (filtros.placa) params = params.set('placa', filtros.placa.trim());
      if (filtros.ruc) params = params.set('ruc', filtros.ruc.trim());
      if (filtros.razonSocial) params = params.set('razonSocial', filtros.razonSocial.trim());
      if (filtros.nroResolucion) params = params.set('nroResolucion', filtros.nroResolucion.trim());
      if (filtros.nroExpediente) params = params.set('nroExpediente', filtros.nroExpediente.trim());
      if (filtros.tipoTramite) params = params.set('tipoTramite', filtros.tipoTramite.trim());
      if (filtros.tipoEmision) params = params.set('tipoEmision', filtros.tipoEmision);
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.skip !== undefined) params = params.set('skip', filtros.skip);
      if (filtros.limit !== undefined) params = params.set('limit', filtros.limit);
    }

    return this.http.get<{ total: number; skip: number; limit: number; items: Tuc[] }>(this.apiUrl, { params }).pipe(
      tap(res => {
        this.tucsSignal.set(res.items);
        this.totalTucsSignal.set(res.total);
        this.loadingSignal.set(false);
      }),
      catchError(err => {
        this.loadingSignal.set(false);
        return throwError(() => err);
      })
    );
  }

  // Limpiar / resetear todo el padrón de TUCs
  limpiarTodo(): Observable<{ success: boolean; mensaje: string; eliminados: number }> {
    return this.http.post<{ success: boolean; mensaje: string; eliminados: number }>(`${this.apiUrl}/limpiar-todo`, {}).pipe(
      tap(() => {
        this.tucsSignal.set([]);
        this.totalTucsSignal.set(0);
      })
    );
  }

  // Obtener Estadísticas
  getEstadisticas(): Observable<TucEstadisticas> {
    return this.http.get<TucEstadisticas>(`${this.apiUrl}/estadisticas`).pipe(
      tap(est => this.estadisticasSignal.set(est))
    );
  }

  // Verificar Unicidad
  verificarUnicidad(nroTuc: string, excluirId?: string): Observable<{ nroTuc: string; disponible: boolean; mensaje: string }> {
    let params = new HttpParams();
    if (excluirId) params = params.set('excluir_id', excluirId);
    return this.http.get<{ nroTuc: string; disponible: boolean; mensaje: string }>(
      `${this.apiUrl}/verificar-unicidad/${encodeURIComponent(nroTuc)}`,
      { params }
    );
  }

  // Obtener Siguiente Número Correlativo
  getSiguienteNumero(tipo: TipoEmisionTuc = 'FISICA'): Observable<{ siguienteNroTuc: string }> {
    return this.http.get<{ siguienteNroTuc: string }>(`${this.apiUrl}/siguiente-numero`, {
      params: new HttpParams().set('tipo', tipo)
    });
  }

  // Emitir TUC
  emitirTuc(payload: TucCreateRequest): Observable<Tuc> {
    return this.http.post<Tuc>(`${this.apiUrl}/emitir`, payload);
  }

  // Emitir Duplicado
  emitirDuplicado(payload: TucDuplicadoRequest): Observable<Tuc> {
    return this.http.post<Tuc>(`${this.apiUrl}/duplicado`, payload);
  }

  // Anular TUC
  anularTuc(id: string, motivo: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/${id}/anular`, null, {
      params: new HttpParams().set('motivo', motivo)
    });
  }

  // Editar y cambiar TUC anulando el actual con registro de motivo
  cambiarAnularTuc(payload: {
    vehiculo_id: string;
    placa: string;
    tuc_actual?: string;
    nuevo_tuc: string;
    motivo: string;
    usuario?: string;
  }): Observable<{ mensaje: string; nuevo_tuc: string; tuc_anterior: string; placa: string }> {
    return this.http.post<{ mensaje: string; nuevo_tuc: string; tuc_anterior: string; placa: string }>(
      `${this.apiUrl}/cambiar-anular-tuc`,
      payload
    );
  }

  // Descargar archivo Word (.docx) generado desde plantilla oficial
  descargarDocxTuc(placaOId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/generar-documento/${encodeURIComponent(placaOId)}`, {
      responseType: 'blob'
    });
  }

  // Obtener datos estructurados de impresión para la tarjeta TUC
  getDatosImpresion(placaOId: string): Observable<{
    placa: string;
    numero_tuc: string;
    datos: any;
    placeholders: Record<string, string>;
  }> {
    return this.http.get<any>(`${this.apiUrl}/datos-impresion/${encodeURIComponent(placaOId)}`);
  }

  // Verificar estado de credenciales de Google Docs
  getGoogleDocsStatus(): Observable<GoogleDocsStatus> {
    return this.http.get<GoogleDocsStatus>(`${this.apiUrl}/google-docs-status`);
  }

  // Obtener configuración de plantilla y márgenes
  getConfiguracionPlantilla(): Observable<TucPlantillaConfig> {
    return this.http.get<TucPlantillaConfig>(`${this.apiUrl}/configuracion-plantilla`);
  }

  // Guardar configuración de plantilla y márgenes
  guardarConfiguracionPlantilla(config: TucPlantillaConfig): Observable<TucPlantillaConfig> {
    return this.http.put<TucPlantillaConfig>(`${this.apiUrl}/configuracion-plantilla`, config);
  }

  // Generar copia en la nube en Google Docs
  generarGoogleDoc(placaOId: string): Observable<{
    exito: boolean;
    disponible: boolean;
    mensaje: string;
    url?: string;
    nuevo_doc_id?: string;
    placa?: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/generar-google-doc/${encodeURIComponent(placaOId)}`, {});
  }

  // Generar copia en la nube en Google Docs para la Notificación
  generarGoogleDocNotificacion(placaOId: string): Observable<{
    exito: boolean;
    mensaje: string;
    url?: string;
    nuevo_doc_id?: string;
    placa?: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/generar-google-doc-notificacion/${encodeURIComponent(placaOId)}`, {});
  }


  // Portal Público QR (Sin Autenticación)
  verificarTucPublico(hashOCodigo: string): Observable<TucVerificacionPublica> {
    return this.http.get<TucVerificacionPublica>(`${this.apiUrl}/verificar/${encodeURIComponent(hashOCodigo)}`);
  }

  // Importar Carga Masiva Excel
  cargaMasivaExcel(archivo: File): Observable<{ totalFilas: number; exitosos: number; fallidos: number; errores: string[] }> {
    const formData = new FormData();
    formData.append('file', archivo);
    return this.http.post<{ totalFilas: number; exitosos: number; fallidos: number; errores: string[] }>(
      `${this.apiUrl}/carga-masiva-excel`,
      formData
    );
  }

  // Sincronizar / Importar datos desde Flota por Empresa
  sincronizarDesdeFlotaEmpresa(): Observable<{ totalFlota: number; importados: number; actualizados: number; omitidos: number; errores: string[] }> {
    return this.http.post<{ totalFlota: number; importados: number; actualizados: number; omitidos: number; errores: string[] }>(
      `${this.apiUrl}/sincronizar-flota`,
      null
    );
  }

  // Kárdex
  getLotesKardex(): Observable<TucKardexStock[]> {
    return this.http.get<TucKardexStock[]>(`${this.apiUrl}/kardex/lotes`);
  }

  registrarLoteKardex(lote: Partial<TucKardexStock>): Observable<TucKardexStock> {
    return this.http.post<TucKardexStock>(`${this.apiUrl}/kardex/lotes`, lote);
  }

  // --- CALIBRADOR DE VARIABLES Y PLANTILLAS HTML INSTANTÁNEAS ---
  getPlantillas(): Observable<PlantillaTucResumen[]> {
    return this.http.get<PlantillaTucResumen[]>(`${this.apiUrl}/calibrador-plantillas`);
  }

  getPlantilla(id: string): Observable<PlantillaTucCalibradorConfig> {
    return this.http.get<PlantillaTucCalibradorConfig>(`${this.apiUrl}/calibrador-plantillas/${encodeURIComponent(id)}`);
  }

  crearPlantilla(plantilla: Partial<PlantillaTucCalibradorConfig>): Observable<PlantillaTucCalibradorConfig> {
    return this.http.post<PlantillaTucCalibradorConfig>(`${this.apiUrl}/calibrador-plantillas`, plantilla);
  }

  actualizarPlantilla(id: string, plantilla: PlantillaTucCalibradorConfig): Observable<PlantillaTucCalibradorConfig> {
    return this.http.put<PlantillaTucCalibradorConfig>(`${this.apiUrl}/calibrador-plantillas/${encodeURIComponent(id)}`, plantilla);
  }

  activarPlantilla(id: string): Observable<PlantillaTucCalibradorConfig> {
    return this.http.post<PlantillaTucCalibradorConfig>(`${this.apiUrl}/calibrador-plantillas/${encodeURIComponent(id)}/activar`, {});
  }

  eliminarPlantilla(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/calibrador-plantillas/${encodeURIComponent(id)}`);
  }

  getCalibradorConfig(plantillaId?: string): Observable<PlantillaTucCalibradorConfig> {
    const params = plantillaId ? `?plantilla_id=${encodeURIComponent(plantillaId)}` : '';
    return this.http.get<PlantillaTucCalibradorConfig>(`${this.apiUrl}/calibrador-config${params}`);
  }

  guardarCalibradorConfig(config: PlantillaTucCalibradorConfig): Observable<PlantillaTucCalibradorConfig> {
    return this.http.put<PlantillaTucCalibradorConfig>(`${this.apiUrl}/calibrador-config`, config);
  }

  restablecerCalibradorConfig(): Observable<PlantillaTucCalibradorConfig> {
    return this.http.post<PlantillaTucCalibradorConfig>(`${this.apiUrl}/calibrador-config/restablecer`, {});
  }

  getUrlRenderHtml(placaOId: string): string {
    return `${this.apiUrl}/render-html/${encodeURIComponent(placaOId)}`;
  }

  imprimirHtmlDirecto(placaOId: string): void {
    const url = this.getUrlRenderHtml(placaOId);
    const win = window.open(url, '_blank', 'width=850,height=1100');
    if (win) {
      win.focus();
    }
  }

  imprimirHtmlConConfig(placaOId: string, config: PlantillaTucCalibradorConfig): void {
    const win = window.open('', '_blank', 'width=850,height=1100');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Impresión TUC</title></head>
        <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #ffffff; color: #475569;">
          <div style="text-align: center;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px;">Preparando documento TUC...</div>
          </div>
        </body>
        </html>
      `);
    }

    const url = `${this.apiUrl}/render-html-preview/${encodeURIComponent(placaOId)}`;
    this.http.post(url, config, { responseType: 'text' }).subscribe({
      next: (html) => {
        if (win && !win.closed) {
          win.document.open();
          win.document.write(html);
          win.document.close();
        } else {
          this.imprimirHtmlDirecto(placaOId);
        }
      },
      error: (err) => {
        console.error('Error al generar HTML de impresión con configuración:', err);
        if (win && !win.closed) {
          win.close();
        }
        this.imprimirHtmlDirecto(placaOId);
      }
    });
  }

  imprimirLoteHtml(placas: string[], config?: PlantillaTucCalibradorConfig): Observable<string> {
    const url = `${this.apiUrl}/render-html-lote`;
    return this.http.post(url, { placas, config }, { responseType: 'text' });
  }

  imprimirLoteDirecto(placas: string[], config?: PlantillaTucCalibradorConfig): void {
    const win = window.open('', '_blank', 'width=950,height=1100');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Impresión Lote de TUCs</title></head>
        <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #ffffff; color: #475569;">
          <div style="text-align: center;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px;">Preparando lote de ${placas.length} TUCs...</div>
            <div style="font-size: 13px; color: #64748b;">Generando hojas para impresión o PDF en bloque</div>
          </div>
        </body>
        </html>
      `);
    }

    this.imprimirLoteHtml(placas, config).subscribe({
      next: (html) => {
        if (win && !win.closed) {
          win.document.open();
          win.document.write(html);
          win.document.close();
        }
      },
      error: (err) => {
        console.error('Error al generar lote HTML:', err);
        if (win && !win.closed) {
          win.close();
        }
      }
    });
  }
}

