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
  getSiguienteNumero(tipo: TipoEmisionTuc = 'ELECTRONICA'): Observable<{ siguienteNroTuc: string }> {
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
}
