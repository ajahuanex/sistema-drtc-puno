import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MovimientoPrestamo {
  id?: string;
  solicitante: string;
  area_solicitante: string;
  cargo_solicitante?: string;
  documento_requerimiento?: string;
  motivo_prestamo?: string;
  fecha_prestamo?: string;
  fecha_limite_devolucion?: string;
  fecha_devolucion_real?: string;
  devuelto?: boolean;
  observaciones_devolucion?: string;
  registrado_por?: string;
}

export interface DocumentoCustodia {
  id?: string;
  _id?: string;
  codigo_custodia?: string;
  nro_memorandum: string;
  fecha_memorandum?: string;
  area_remitente: string;
  remitente_nombre?: string;
  asunto_memorandum?: string;
  nro_expediente: string;
  fecha_expediente?: string;
  nro_folios: number;
  nro_tomos: number;
  asunto_expediente: string;
  tipo_tramite?: string;
  ruc?: string;
  razon_social?: string;
  nro_resolucion?: string;
  ubicacion_estante?: string;
  ubicacion_archivador?: string;
  codigo_ubicacion?: string;
  estado_conservacion?: 'BUENO' | 'REGULAR' | 'DETERIORADO' | string;
  estado_custodia?: 'EN_CUSTODIA' | 'PRESTADO' | 'DEVUELTO' | 'TRANSFERIDO_ARCHIVO_CENTRAL' | string;
  archivo_memo?: string;
  nombre_archivo_memo?: string;
  archivo_expediente?: string;
  nombre_archivo_expediente?: string;
  observaciones?: string;
  fecha_ingreso_custodia?: string;
  fecha_actualizacion?: string;
  prestamo_actual?: MovimientoPrestamo | null;
  historial_prestamos?: MovimientoPrestamo[];
  documentos_acumulados?: DocumentoAcumulado[];
}

export interface DocumentoAcumulado {
  id?: string;
  tipo_documento?: string;
  nro_documento?: string;
  fecha_documento?: string;
  folios_agregados?: number;
  asunto?: string;
  area_remitente?: string;
  remitente_nombre?: string;
  archivo_adjunto?: string;
  nombre_archivo?: string;
  fecha_acumulacion?: string;
  registrado_por?: string;
}

export interface EstadisticasCustodia {
  total_general: number;
  en_custodia: number;
  prestados: number;
  transferidos: number;
  total_folios: number;
  por_area: { _id: string; cantidad: number }[];
  ultimos_ingresos: DocumentoCustodia[];
}

export interface RespuestaListadoCustodia {
  total: number;
  skip: number;
  limit: number;
  items: DocumentoCustodia[];
}

@Injectable({
  providedIn: 'root'
})
export class CustodiaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/custodia`;

  // Signals reactivos para el estado del módulo
  documentos = signal<DocumentoCustodia[]>([]);
  totalDocumentos = signal<number>(0);
  estadisticas = signal<EstadisticasCustodia | null>(null);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  /**
   * Carga la lista paginada y filtrada
   */
  cargarDocumentos(
    skip = 0,
    limit = 50,
    search?: string,
    estado?: string,
    area?: string,
    tipo_tramite?: string
  ): Observable<RespuestaListadoCustodia> {
    this.cargando.set(true);
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (estado && estado !== 'TODOS') {
      params = params.set('estado', estado);
    }
    if (area && area !== 'TODOS') {
      params = params.set('area', area);
    }
    if (tipo_tramite && tipo_tramite !== 'TODOS') {
      params = params.set('tipo_tramite', tipo_tramite);
    }

    return this.http.get<RespuestaListadoCustodia>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.documentos.set(res.items || []);
          this.totalDocumentos.set(res.total || 0);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Error al cargar acervo en custodia');
          this.cargando.set(false);
        }
      })
    );
  }

  /**
   * Obtiene estadísticas y métricas del archivo
   */
  cargarEstadisticas(): Observable<EstadisticasCustodia> {
    return this.http.get<EstadisticasCustodia>(`${this.apiUrl}/stats`).pipe(
      tap({
        next: (stats) => this.estadisticas.set(stats),
        error: (err) => console.error('Error al cargar stats de custodia:', err)
      })
    );
  }

  /**
   * Obtiene el detalle de un documento en custodia
   */
  obtenerPorId(id: string): Observable<DocumentoCustodia> {
    return this.http.get<DocumentoCustodia>(`${this.apiUrl}/${id}`);
  }

  /**
   * Registra un nuevo documento en custodia adjuntando opcionalmente los archivos escaneados
   */
  crearConArchivos(formData: FormData): Observable<DocumentoCustodia> {
    return this.http.post<DocumentoCustodia>(`${this.apiUrl}/con-archivos`, formData).pipe(
      tap(() => {
        this.cargarEstadisticas().subscribe();
      })
    );
  }

  /**
   * Actualiza metadatos del expediente en custodia
   */
  actualizar(id: string, data: Partial<DocumentoCustodia>): Observable<DocumentoCustodia> {
    return this.http.put<DocumentoCustodia>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => {
        this.cargarEstadisticas().subscribe();
      })
    );
  }

  /**
   * Elimina un registro de custodia
   */
  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cargarEstadisticas().subscribe();
      })
    );
  }

  /**
   * Sube o reemplaza el PDF del Memorándum
   */
  subirArchivoMemo(id: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return this.http.post(`${this.apiUrl}/${id}/upload-memo`, formData);
  }

  /**
   * Sube o reemplaza el PDF escaneado del expediente
   */
  subirArchivoExpediente(id: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return this.http.post(`${this.apiUrl}/${id}/upload-expediente`, formData);
  }

  /**
   * Registra la salida temporal por préstamo a funcionario/oficina
   */
  registrarPrestamo(id: string, prestamo: MovimientoPrestamo): Observable<DocumentoCustodia> {
    return this.http.post<DocumentoCustodia>(`${this.apiUrl}/${id}/prestamo`, prestamo).pipe(
      tap(() => {
        this.cargarEstadisticas().subscribe();
      })
    );
  }

  /**
   * Registra la devolución y reingreso a custodia
   */
  registrarDevolucion(id: string, observaciones?: string): Observable<DocumentoCustodia> {
    return this.http.post<DocumentoCustodia>(`${this.apiUrl}/${id}/devolucion`, {
      observaciones_devolucion: observaciones || 'Devolución conforme'
    }).pipe(
      tap(() => {
        this.cargarEstadisticas().subscribe();
      })
    );
  }

  /**
   * Acumula o anexa un actuado complementario al documento principal
   */
  acumularDocumento(id: string, formData: FormData): Observable<DocumentoCustodia> {
    return this.http.post<DocumentoCustodia>(`${this.apiUrl}/${id}/acumular`, formData).pipe(
      tap(() => {
        this.cargarEstadisticas().subscribe();
      })
    );
  }

  /**
   * Resuelve URL absoluta para previsualizar o descargar un archivo adjunto
   */
  getArchivoUrl(pathRelativo?: string): string {
    if (!pathRelativo) return '';
    if (pathRelativo.startsWith('http')) return pathRelativo;
    // Si viene como /uploads/... o uploads/...
    const backendHost = environment.apiUrl.replace('/api/v1', '');
    const cleanPath = pathRelativo.startsWith('/') ? pathRelativo : `/${pathRelativo}`;
    return `${backendHost}${cleanPath}`;
  }
}
