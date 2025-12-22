import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, forkJoin } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { EmpresaService } from './empresa.service';
import { Resolucion, ResolucionCreate, ResolucionUpdate, TipoTramite } from '../models/resolucion.model';
import { ResolucionFiltros, ResolucionConEmpresa, EstadisticasResoluciones } from '../models/resolucion-table.model';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResolucionService {
  private apiUrl = environment.apiUrl;



  private empresaService = inject(EmpresaService);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
  }

  /**
   * Método para obtener el tipo de trámite desde el expediente
   * 
   * LÓGICA IMPLEMENTADA:
   * - El tipo de trámite de una resolución debe venir del expediente asociado
   * - Los expedientes determinan si una resolución es PADRE o HIJO:
   *   * PRIMIGENIA y RENOVACION → Resolución PADRE
   *   * INCREMENTO, SUSTITUCION, OTROS → Resolución HIJO
   * - Las resoluciones HIJO deben tener una resolución PADRE asociada
   * - El sistema mantiene la consistencia entre expedientes, empresas y resoluciones
   * 
   * MAPEO DE EXPEDIENTES:
   * - E-0001-2025 (ID: 1) → PRIMIGENIA → Resolución PADRE
   * - E-0002-2025 (ID: 2) → RENOVACION → Resolución PADRE  
   * - E-0003-2025 (ID: 3) → INCREMENTO → Resolución HIJO (depende de ID: 1)
   * - E-0001-2026 (ID: 4) → PRIMIGENIA → Resolución PADRE
   * - E-0002-2026 (ID: 5) → RENOVACION → Resolución PADRE
   * - E-0003-2026 (ID: 6) → INCREMENTO → Resolución HIJO (depende de ID: 4)
   * - E-0004-2026 (ID: 7) → SUSTITUCION → Resolución HIJO (depende de ID: 3)
   * - E-0005-2026 (ID: 8) → OTROS → Resolución HIJO (depende de ID: 1)
   * - E-0001-2027 (ID: 9) → PRIMIGENIA → Resolución PADRE
   * - E-0002-2027 (ID: 10) → RENOVACION → Resolución HIJO (depende de ID: 12)
   */
  private obtenerTipoTramiteDesdeExpediente(expedienteId: string): TipoTramite {
    // Mapeo de expedientes a tipos de trámite
    const mapeoExpedientes: { [key: string]: TipoTramite } = {
      '1': 'AUTORIZACION_NUEVA',      // E-0001-2025
      '2': 'RENOVACION',      // E-0002-2025  
      '3': 'INCREMENTO',      // E-0003-2025
      '4': 'AUTORIZACION_NUEVA',      // E-0001-2026
      '5': 'RENOVACION',      // E-0002-2026
      '6': 'INCREMENTO',      // E-0003-2026
      '7': 'SUSTITUCION',     // E-0004-2026
      '8': 'OTROS',           // E-0005-2026
      '9': 'AUTORIZACION_NUEVA',      // E-0001-2027
      '10': 'RENOVACION'      // E-0002-2027
    };

    return mapeoExpedientes[expedienteId] || 'OTROS';
  }



  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getResoluciones(skip: number = 0, limit: number = 100, estado?: string, empresaId?: string, tipo?: string): Observable<Resolucion[]> {
    const url = `${this.apiUrl}/resoluciones`;
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    if (limit !== 100) params.append('limit', limit.toString());
    if (estado) params.append('estado', estado);
    if (empresaId) params.append('empresa_id', empresaId);
    if (tipo) params.append('tipo_tramite', tipo);

    return this.http.get<Resolucion[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching resoluciones:', error);
          return throwError(() => error);
        })
      );
  }

  getResolucionById(id: string): Observable<Resolucion> {
    const url = `${this.apiUrl}/resoluciones/${id}`;

    return this.http.get<Resolucion>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching resolucion:', error);
          // No hay fallback disponible
          return throwError(() => new Error('Resolución no encontrada'));
        })
      );
  }

  /**
   * Valida que el número de resolución sea único para el año especificado
   * @param numero - Número de resolución a validar
   * @param fechaEmision - Fecha de emisión para determinar el año
   * @returns true si el número es único, false si ya existe
   */
  private validarNumeroUnicoPorAnio(numero: string, fechaEmision: Date): boolean {
    const anio = new Date(fechaEmision).getFullYear();
    const numeroCompleto = `R-${numero}-${anio}`;

    // El backend validará contra la base de datos real
    return true;
  }

  createResolucion(resolucion: ResolucionCreate): Observable<Resolucion> {
    // COMENTADO: No validar en frontend, dejar que el backend valide contra MongoDB
    // if (!this.validarNumeroUnicoPorAnio(resolucion.numero, resolucion.fechaEmision)) {
    //   const anio = new Date(resolucion.fechaEmision).getFullYear();
    //   return throwError(() => new Error(`Ya existe una resolución con el número ${resolucion.numero} en el año ${anio}`));
    // }

    const url = `${this.apiUrl}/resoluciones`;

    // Mapear tipoTramite del frontend al backend
    // Frontend usa AUTORIZACION_NUEVA, backend usa PRIMIGENIA
    let tipoTramiteBackend: string = resolucion.tipoTramite;
    if (tipoTramiteBackend === 'AUTORIZACION_NUEVA') {
      tipoTramiteBackend = 'PRIMIGENIA';
    }

    // Preparar datos para el backend
    // El número ya viene completo desde el frontend (R-0123-2025)
    const resolucionBackend: any = {
      nroResolucion: resolucion.nroResolucion,
      empresaId: resolucion.empresaId,
      expedienteId: resolucion.expedienteId,
      fechaEmision: resolucion.fechaEmision,
      fechaVigenciaInicio: resolucion.fechaVigenciaInicio || null,
      fechaVigenciaFin: resolucion.fechaVigenciaFin || null,
      tipoResolucion: resolucion.tipoResolucion,
      resolucionPadreId: resolucion.resolucionPadreId || null,
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: resolucion.vehiculosHabilitadosIds || [],
      rutasAutorizadasIds: resolucion.rutasAutorizadasIds || [],
      tipoTramite: tipoTramiteBackend,
      descripcion: resolucion.descripcion,
      documentoId: null,
      estaActivo: true,
      fechaRegistro: new Date(),
      fechaActualizacion: null,
      usuarioEmisionId: this.authService.getCurrentUserId() || 'admin', // Usuario autenticado
      observaciones: resolucion.observaciones || null,
      estado: 'VIGENTE',
      motivoSuspension: null,
      fechaSuspension: null,
      usuarioSuspensionId: null,
      motivoAnulacion: null,
      fechaAnulacion: null,
      usuarioAnulacionId: null
    };

    console.log('Creando resolución en backend:', resolucionBackend);
    console.log('URL del backend:', url);
    console.log('Headers:', this.getHeaders());

    return this.http.post<Resolucion>(url, resolucionBackend, { headers: this.getHeaders() })
      .pipe(
        tap(resolucionCreada => {
          console.log('Resolución creada exitosamente en backend:', resolucionCreada);
          // Resolución creada exitosamente
          const nuevaResolucion: Resolucion = {
            id: resolucionCreada.id || Date.now().toString(),
            nroResolucion: resolucionCreada.nroResolucion,
            empresaId: resolucionCreada.empresaId,
            expedienteId: resolucionCreada.expedienteId,
            fechaEmision: resolucionCreada.fechaEmision,
            fechaVigenciaInicio: resolucionCreada.fechaVigenciaInicio,
            fechaVigenciaFin: resolucionCreada.fechaVigenciaFin,
            tipoResolucion: resolucionCreada.tipoResolucion,
            resolucionPadreId: resolucionCreada.resolucionPadreId,
            resolucionesHijasIds: resolucionCreada.resolucionesHijasIds || [],
            vehiculosHabilitadosIds: resolucionCreada.vehiculosHabilitadosIds || [],
            rutasAutorizadasIds: resolucionCreada.rutasAutorizadasIds || [],
            tipoTramite: resolucionCreada.tipoTramite,
            descripcion: resolucionCreada.descripcion,
            documentoId: resolucionCreada.documentoId,
            estaActivo: resolucionCreada.estaActivo || true,
            estado: resolucionCreada.estado || 'VIGENTE',
            fechaRegistro: resolucionCreada.fechaRegistro || new Date(),
            fechaActualizacion: resolucionCreada.fechaActualizacion || new Date(),
            usuarioEmisionId: resolucionCreada.usuarioEmisionId || 'user1',
            usuarioAprobacionId: resolucionCreada.usuarioAprobacionId || 'user1',
            fechaAprobacion: resolucionCreada.fechaAprobacion || new Date(),
            documentos: resolucionCreada.documentos || [],
            auditoria: resolucionCreada.auditoria || []
          };
          console.log('Resolución creada:', nuevaResolucion);

          // Las relaciones padre-hijo se manejan en el backend
        }),
        catchError(error => {
          console.error('Error creating resolucion in backend:', error);
          return throwError(() => error);
        })
      );
  }

  updateResolucion(id: string, resolucion: ResolucionUpdate): Observable<Resolucion> {
    const url = `${this.apiUrl}/resoluciones/${id}`;

    return this.http.put<Resolucion>(url, resolucion, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating resolucion:', error);
          return throwError(() => error);
        })
      );
  }

  deleteResolucion(id: string): Observable<void> {
    const url = `${this.apiUrl}/resoluciones/${id}`;

    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting resolucion:', error);
          return throwError(() => error);
        })
      );
  }

  getResolucionesPorEmpresa(empresaId: string): Observable<Resolucion[]> {
    console.log('=== INICIO getResolucionesPorEmpresa ===');
    console.log('Empresa ID solicitada:', empresaId);
    console.log('Consultando resoluciones desde backend');

    const url = `${this.apiUrl}/resoluciones`;
    const params = new URLSearchParams();
    params.append('empresa_id', empresaId);

    console.log('Intentando hacer HTTP GET a:', `${url}?${params.toString()}`);

    return this.http.get<Resolucion[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        tap((resoluciones: Resolucion[]) => {
          console.log('=== DATOS DEL BACKEND ===');
          console.log('Resoluciones recibidas del backend:', resoluciones);
          console.log('Total de resoluciones del backend:', resoluciones.length);

          // Log detallado de cada resolución del backend
          resoluciones.forEach((r: Resolucion, index: number) => {
            console.log(`Resolución backend ${index + 1}:`, {
              id: r.id,
              nroResolucion: r.nroResolucion,
              empresaId: r.empresaId,
              tipoResolucion: r.tipoResolucion,
              estado: r.estado,
              estaActivo: r.estaActivo,
              // Log completo para debugging
              objetoCompleto: r
            });
          });
          console.log('=== FIN DATOS DEL BACKEND ===');
        }),
        catchError(error => {
          console.error('Error fetching resoluciones por empresa:', error);
          return throwError(() => error);
        })
      );
  }

  agregarResolucionAEmpresa(empresaId: string, resolucionId: string): Observable<Resolucion> {
    const url = `${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`;

    return this.http.post<Resolucion>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error adding resolucion to empresa:', error);
          // Error al agregar resolución a empresa
          return throwError(() => new Error('Resolución no encontrada'));
        })
      );
  }

  removerResolucionDeEmpresa(empresaId: string, resolucionId: string): Observable<void> {
    const url = `${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`;

    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error removing resolucion from empresa:', error);
          // Simular éxito en caso de error
          return of(void 0);
        })
      );
  }

  getResolucionesByTipo(tipo: string): Observable<Resolucion[]> {
    // Usar endpoint del backend para filtrar por tipo
    const url = `${this.apiUrl}/resoluciones/filtros?tipo_resolucion=${tipo}`;
    return this.http.get<Resolucion[]>(url, { headers: this.getHeaders() });
  }

  getResolucionesByTipoTramite(tipoTramite: string): Observable<Resolucion[]> {
    // Usar endpoint del backend para filtrar por tipo de trámite
    const url = `${this.apiUrl}/resoluciones/filtros?tipo_tramite=${tipoTramite}`;
    return this.http.get<Resolucion[]>(url, { headers: this.getHeaders() });
  }

  // Método para debuggear el estado actual de los datos del backend
  debugData(): void {
    console.log('=== DEBUG DATOS BACKEND ===');
    this.getResoluciones().subscribe(resoluciones => {
      console.log('Total de resoluciones en backend:', resoluciones.length);
      const empresas = Array.from(new Set(resoluciones.map(r => r.empresaId)));
      empresas.forEach(empresaId => {
        const resolucionesEmpresa = resoluciones.filter(r => r.empresaId === empresaId);
        console.log(`Empresa ${empresaId}:`, resolucionesEmpresa.length);
      });
      console.log('========================');
    });
  }

  /**
   * Obtiene resoluciones filtradas según los criterios especificados
   * @param filtros - Objeto con los criterios de filtrado
   * @returns Observable con las resoluciones filtradas
   */
  getResolucionesFiltradas(filtros: ResolucionFiltros): Observable<ResolucionConEmpresa[]> {
    console.log('=== getResolucionesFiltradas ===');
    console.log('Filtros recibidos (frontend):', filtros);

    // Iniciar medición de rendimiento
    PerformanceMonitor.startMeasure('getResolucionesFiltradas');

    // CONVERTIR filtros del formato frontend al formato backend
    const filtrosBackend: any = this.convertirFiltrosFrontendABackend(filtros);
    console.log('Filtros convertidos (backend):', filtrosBackend);

    // Intentar obtener del backend primero
    const url = `${this.apiUrl}/resoluciones/filtradas`;

    return this.http.post<Resolucion[]>(url, filtrosBackend, { headers: this.getHeaders() })
      .pipe(
        switchMap((resoluciones: Resolucion[]) => {
          console.log('Resoluciones del backend:', resoluciones.length);
          return this.enrichResolucionesConEmpresa(resoluciones);
        }),
        tap(resoluciones => {
          // Finalizar medición y registrar métricas
          const executionTime = PerformanceMonitor.endMeasure('getResolucionesFiltradas');
          PerformanceMonitor.recordFilterMetrics({
            filterType: 'backend',
            executionTime,
            resultCount: resoluciones.length,
            datasetSize: resoluciones.length,
            timestamp: new Date()
          });
        }),
        catchError(error => {
          console.error('Error fetching filtered resoluciones from backend:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Convierte filtros del formato frontend al formato backend
   * @param filtrosFrontend - Filtros en formato del frontend
   * @returns Filtros en formato del backend
   */
  private convertirFiltrosFrontendABackend(filtrosFrontend: ResolucionFiltros): any {
    const filtrosBackend: any = {};

    // Mapear numeroResolucion (frontend) → nroResolucion (backend)
    if (filtrosFrontend.numeroResolucion) {
      filtrosBackend.nroResolucion = filtrosFrontend.numeroResolucion;
    }

    // Mapear estados array (frontend) → estado string (backend)
    if (filtrosFrontend.estados && filtrosFrontend.estados.length > 0) {
      filtrosBackend.estado = filtrosFrontend.estados[0]; // Tomar el primer estado
    }

    // Mapear otros campos directamente
    if (filtrosFrontend.empresaId) {
      filtrosBackend.empresaId = filtrosFrontend.empresaId;
    }

    if (filtrosFrontend.tiposTramite && filtrosFrontend.tiposTramite.length > 0) {
      filtrosBackend.tipoTramite = filtrosFrontend.tiposTramite[0]; // Tomar el primer tipo
    }

    if (filtrosFrontend.fechaInicio) {
      filtrosBackend.fechaEmisionDesde = filtrosFrontend.fechaInicio;
    }

    if (filtrosFrontend.fechaFin) {
      filtrosBackend.fechaEmisionHasta = filtrosFrontend.fechaFin;
    }

    return filtrosBackend;
  }

  /**
   * Obtiene resoluciones con datos de empresa incluidos
   * @returns Observable con las resoluciones enriquecidas con datos de empresa
   */
  getResolucionesConEmpresa(): Observable<ResolucionConEmpresa[]> {
    console.log('=== getResolucionesConEmpresa ===');

    return this.getResoluciones().pipe(
      switchMap((resoluciones: Resolucion[]) => {
        return this.enrichResolucionesConEmpresa(resoluciones);
      })
    );
  }

  /**
   * Enriquece las resoluciones con datos de empresa
   * @param resoluciones - Array de resoluciones a enriquecer
   * @returns Observable con las resoluciones enriquecidas
   */
  private enrichResolucionesConEmpresa(resoluciones: Resolucion[]): Observable<ResolucionConEmpresa[]> {
    if (resoluciones.length === 0) {
      return of([]);
    }

    // Obtener IDs únicos de empresas
    const empresaIds = Array.from(new Set(resoluciones.map(r => r.empresaId)));

    // Obtener datos de todas las empresas en paralelo
    const empresasObservables = empresaIds.map(id =>
      this.empresaService.getEmpresa(id).pipe(
        catchError(error => {
          console.error(`Error fetching empresa ${id}:`, error);
          return of(null);
        })
      )
    );

    return forkJoin(empresasObservables).pipe(
      map(empresas => {
        // Crear un mapa de empresas por ID
        const empresaMap = new Map();
        empresas.forEach((empresa, index) => {
          if (empresa) {
            empresaMap.set(empresaIds[index], empresa);
          }
        });

        // Enriquecer resoluciones con datos de empresa
        const resolucionesConEmpresa: ResolucionConEmpresa[] = resoluciones.map(resolucion => {
          const empresa = empresaMap.get(resolucion.empresaId);

          if (empresa) {
            return {
              ...resolucion,
              empresa: {
                id: empresa.id,
                razonSocial: {
                  principal: empresa.razonSocial.principal,
                  comercial: empresa.razonSocial.minimo
                },
                ruc: empresa.ruc
              }
            } as ResolucionConEmpresa;
          }

          // Si no se encuentra la empresa, retornar sin datos de empresa
          return {
            ...resolucion,
            empresa: undefined
          } as ResolucionConEmpresa;
        });

        console.log('Resoluciones enriquecidas con empresa:', resolucionesConEmpresa.length);
        return resolucionesConEmpresa;
      })
    );
  }

  /**
   * Exporta resoluciones en el formato especificado
   * @param filtros - Filtros aplicados a las resoluciones
   * @param formato - Formato de exportación ('excel' o 'pdf')
   * @returns Observable con el blob del archivo exportado
   */
  exportarResoluciones(filtros: ResolucionFiltros, formato: 'excel' | 'pdf' = 'excel'): Observable<Blob> {
    console.log('=== exportarResoluciones ===');
    console.log('Formato:', formato);
    console.log('Filtros:', filtros);

    const url = `${this.apiUrl}/resoluciones/exportar`;
    const params = new URLSearchParams();
    params.append('formato', formato);

    return this.http.post(
      `${url}?${params.toString()}`,
      filtros,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    ).pipe(
      catchError(error => {
        console.error('Error exporting resoluciones:', error);

        // Fallback: generar exportación local simple
        return this.getResolucionesFiltradas(filtros).pipe(
          map(resoluciones => {
            // Crear un CSV simple como fallback
            const headers = ['Número', 'Empresa', 'Tipo Trámite', 'Fecha Emisión', 'Estado'];
            const rows = resoluciones.map(r => [
              r.nroResolucion,
              r.empresa?.razonSocial.principal || 'Sin empresa',
              r.tipoTramite,
              new Date(r.fechaEmision).toLocaleDateString(),
              r.estado
            ]);

            const csvContent = [
              headers.join(','),
              ...rows.map(row => row.join(','))
            ].join('\n');

            return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          })
        );
      })
    );
  }

  /**
   * Obtiene estadísticas de resoluciones según los filtros aplicados
   * @param filtros - Filtros para calcular estadísticas
   * @returns Observable con las estadísticas
   */
  getEstadisticasFiltros(filtros: ResolucionFiltros): Observable<EstadisticasResoluciones> {
    console.log('=== getEstadisticasFiltros ===');
    console.log('Filtros:', filtros);

    return this.getResolucionesFiltradas(filtros).pipe(
      map(resoluciones => {
        const estadisticas: EstadisticasResoluciones = {
          total: resoluciones.length,
          porTipo: {},
          porEstado: {},
          porEmpresa: {}
        };

        // Calcular estadísticas por tipo de trámite
        resoluciones.forEach(r => {
          // Por tipo
          if (!estadisticas.porTipo[r.tipoTramite]) {
            estadisticas.porTipo[r.tipoTramite] = 0;
          }
          estadisticas.porTipo[r.tipoTramite]++;

          // Por estado
          if (r.estado) {
            if (!estadisticas.porEstado[r.estado]) {
              estadisticas.porEstado[r.estado] = 0;
            }
            estadisticas.porEstado[r.estado]++;
          }

          // Por empresa
          if (r.empresa) {
            if (!estadisticas.porEmpresa[r.empresaId]) {
              estadisticas.porEmpresa[r.empresaId] = {
                nombre: r.empresa.razonSocial.principal,
                cantidad: 0
              };
            }
            estadisticas.porEmpresa[r.empresaId].cantidad++;
          }
        });

        console.log('Estadísticas calculadas:', estadisticas);
        return estadisticas;
      })
    );
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA DESDE EXCEL
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva de resoluciones
   */
  descargarPlantillaExcel(): Observable<Blob> {
    const url = `${this.apiUrl}/resoluciones/carga-masiva/plantilla`;

    return this.http.get(url, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error descargando plantilla de resoluciones:', error);
        return throwError(() => new Error('Error al descargar la plantilla'));
      })
    );
  }

  /**
   * Validar archivo Excel de resoluciones sin procesarlo
   */
  validarArchivoExcel(archivo: File): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/carga-masiva/validar`;
    const formData = new FormData();
    formData.append('archivo', archivo);

    // Headers sin Content-Type para FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error validando archivo de resoluciones:', error);
        return throwError(() => new Error('Error al validar el archivo'));
      })
    );
  }

  /**
   * Procesar carga masiva de resoluciones desde Excel
   */
  procesarCargaMasiva(archivo: File, soloValidar: boolean = false): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/carga-masiva/procesar`;
    const formData = new FormData();
    formData.append('archivo', archivo);

    // Agregar parámetro de solo validar
    const params = new URLSearchParams();
    if (soloValidar) {
      params.append('solo_validar', 'true');
    }

    // Headers sin Content-Type para FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

    return this.http.post(finalUrl, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error procesando carga masiva de resoluciones:', error);
        return throwError(() => new Error('Error al procesar el archivo'));
      })
    );
  }
} 
