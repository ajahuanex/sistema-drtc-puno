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
    
    // Si no hay token, devolver headers básicos sin Authorization
    if (!token) {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getResoluciones(skip: number = 0, limit: number = 1000, estado?: string, empresaId?: string, tipo?: string): Observable<Resolucion[]> {
    // Aumentar el límite para obtener todas las resoluciones
    const url = `${this.apiUrl}/resoluciones`;
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    params.append('limit', limit.toString()); // Siempre agregar el límite
    if (estado) params.append('estado', estado);
    if (empresaId) params.append('empresa_id', empresaId);
    if (tipo) params.append('tipo_tramite', tipo);

    const finalUrl = `${url}?${params.toString()}`;
    // console.log removed for production
    // console.log removed for production

    return this.http.get<Resolucion[]>(finalUrl, { headers: this.getHeaders() })
      .pipe(
        tap(resoluciones => {
          // console.log removed for production
        }),
        catchError(error => {
          console.error('❌ [RESOLUCION-SERVICE] Error fetching resoluciones::', error);
          
          // Si es error de autenticación y no hay token, devolver array vacío
          if ((error.status === 401 || error.status === 403) && !this.authService.getToken()) {
            // console.log removed for production
            return of([]);
          }
          
          return throwError(() => error);
        })
      );
  }

  getResolucionById(id: string): Observable<Resolucion> {
    const url = `${this.apiUrl}/resoluciones/${id}`;

    return this.http.get<Resolucion>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching resolucion::', error);
          // No hay fallback disponible
          return throwError(() => new Error('Resolución no encontrada'));
        })
      );
  }

  /**
   * Alias para getResolucionById para compatibilidad
   */
  getResolucionPorId(id: string): Observable<Resolucion> {
    return this.getResolucionById(id);
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

    // console.log removed for production
    // console.log removed for production
    console.log('Headers:', this.getHeaders());

    return this.http.post<Resolucion>(url, resolucionBackend, { headers: this.getHeaders() })
      .pipe(
        tap(resolucionCreada => {
          // console.log removed for production
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
          // console.log removed for production

          // Las relaciones padre-hijo se manejan en el backend
        }),
        catchError(error => {
          console.error('Error creating resolucion in backend::', error);
          return throwError(() => error);
        })
      );
  }

  updateResolucion(id: string, resolucion: ResolucionUpdate): Observable<Resolucion> {
    const url = `${this.apiUrl}/resoluciones/${id}`;

    return this.http.put<Resolucion>(url, resolucion, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating resolucion::', error);
          return throwError(() => error);
        })
      );
  }

  deleteResolucion(id: string): Observable<void> {
    const url = `${this.apiUrl}/resoluciones/${id}`;

    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting resolucion::', error);
          return throwError(() => error);
        })
      );
  }

  getResolucionesPorEmpresa(empresaId: string): Observable<Resolucion[]> {
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production

    const url = `${this.apiUrl}/resoluciones`;
    const params = new URLSearchParams();
    params.append('empresa_id', empresaId);

    console.log('Intentando hacer HTTP GET a:', `${url}?${params.toString()}`);

    return this.http.get<Resolucion[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        tap((resoluciones: Resolucion[]) => {
          // console.log removed for production
          // console.log removed for production
          // console.log removed for production

          // Log detallado de cada resolución del backend
          resoluciones.forEach((r: Resolucion, index: number) => {
            // console.log removed for production
          });
          // console.log removed for production
        }),
        catchError(error => {
          console.error('Error fetching resoluciones por empresa::', error);
          return throwError(() => error);
        })
      );
  }

  agregarResolucionAEmpresa(empresaId: string, resolucionId: string): Observable<Resolucion> {
    const url = `${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`;

    return this.http.post<Resolucion>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error adding resolucion to empresa::', error);
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
          console.error('Error removing resolucion from empresa::', error);
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
    // console.log removed for production
    this.getResoluciones().subscribe(resoluciones => {
      // console.log removed for production
      const empresas = Array.from(new Set(resoluciones.map(r => r.empresaId)));
      empresas.forEach(empresaId => {
        const resolucionesEmpresa = resoluciones.filter(r => r.empresaId === empresaId);
        // console.log removed for production
      });
      // console.log removed for production
    });
  }

  /**
   * Obtiene resoluciones filtradas según los criterios especificados
   * @param filtros - Objeto con los criterios de filtrado
   * @returns Observable con las resoluciones filtradas
   */
  getResolucionesFiltradas(filtros: ResolucionFiltros): Observable<ResolucionConEmpresa[]> {
    // console.log removed for production
    console.log('Filtros recibidos (frontend):', filtros);

    // Iniciar medición de rendimiento
    PerformanceMonitor.startMeasure('getResolucionesFiltradas');

    // Si hay búsqueda general, usar filtrado local
    if (filtros.busquedaGeneral) {
      // console.log removed for production
      return this.getResolucionesConEmpresa().pipe(
        map(resoluciones => this.filtrarResolucionesLocal(resoluciones, filtros)),
        tap(resoluciones => {
          const executionTime = PerformanceMonitor.endMeasure('getResolucionesFiltradas');
          PerformanceMonitor.recordFilterMetrics({
            filterType: 'local',
            executionTime,
            resultCount: resoluciones.length,
            datasetSize: resoluciones.length,
            timestamp: new Date()
          });
        })
      );
    }

    // CONVERTIR filtros del formato frontend al formato backend
    const filtrosBackend: any = this.convertirFiltrosFrontendABackend(filtros);
    console.log('Filtros convertidos (backend):', filtrosBackend);

    // Intentar obtener del backend primero
    const url = `${this.apiUrl}/resoluciones/filtradas`;

    return this.http.post<Resolucion[]>(url, filtrosBackend, { headers: this.getHeaders() })
      .pipe(
        switchMap((resoluciones: Resolucion[]) => {
          // console.log removed for production
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
          console.error('Error fetching filtered resoluciones from backend, usando filtrado local::', error);
          // Fallback a filtrado local
          return this.getResolucionesConEmpresa().pipe(
            map(resoluciones => this.filtrarResolucionesLocal(resoluciones, filtros))
          );
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

    // Búsqueda inteligente (número, razón social o RUC)
    if (filtrosFrontend.busquedaGeneral) {
      filtrosBackend.busquedaGeneral = filtrosFrontend.busquedaGeneral;
    }

    // Mapear numeroResolucion (frontend) → nroResolucion (backend) - para compatibilidad
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
   * Filtra resoluciones localmente (en el frontend)
   * @param resoluciones - Lista de resoluciones con empresa
   * @param filtros - Filtros a aplicar
   * @returns Lista filtrada
   */
  private filtrarResolucionesLocal(resoluciones: ResolucionConEmpresa[], filtros: ResolucionFiltros): ResolucionConEmpresa[] {
    // console.log removed for production
    
    const resultados = resoluciones.filter(resolucion => {
      // Búsqueda general (número, razón social o RUC)
      if (filtros.busquedaGeneral) {
        const busqueda = filtros.busquedaGeneral.toLowerCase().trim();
        const coincideNumero = resolucion.nroResolucion.toLowerCase().includes(busqueda);
        const coincideRazonSocial = resolucion.empresa?.razonSocial?.principal?.toLowerCase().includes(busqueda) || false;
        const coincideRUC = resolucion.empresa?.ruc?.includes(busqueda) || false;
        
        // console.log removed for production
        
        if (!coincideNumero && !coincideRazonSocial && !coincideRUC) {
          return false;
        }
      }

      // Filtro por número de resolución específico
      if (filtros.numeroResolucion) {
        const numeroFiltro = filtros.numeroResolucion.toLowerCase().trim();
        if (!resolucion.nroResolucion.toLowerCase().includes(numeroFiltro)) {
          return false;
        }
      }

      // Filtro por estados
      if (filtros.estados && filtros.estados.length > 0) {
        if (!filtros.estados.includes(resolucion.estado || '')) {
          return false;
        }
      }

      // Filtro por tipos de trámite
      if (filtros.tiposTramite && filtros.tiposTramite.length > 0) {
        if (!filtros.tiposTramite.includes(resolucion.tipoTramite)) {
          return false;
        }
      }

      // Filtro por empresa
      if (filtros.empresaId) {
        if (resolucion.empresaId !== filtros.empresaId) {
          return false;
        }
      }

      // Filtro por fecha de inicio
      if (filtros.fechaInicio) {
        const fechaEmision = new Date(resolucion.fechaEmision);
        const fechaInicio = new Date(filtros.fechaInicio);
        if (fechaEmision < fechaInicio) {
          return false;
        }
      }

      // Filtro por fecha de fin
      if (filtros.fechaFin) {
        const fechaEmision = new Date(resolucion.fechaEmision);
        const fechaFin = new Date(filtros.fechaFin);
        if (fechaEmision > fechaFin) {
          return false;
        }
      }

      return true;
    });
    
    // console.log removed for production
    return resultados;
  }

  /**
   * Obtiene resoluciones con datos de empresa incluidos
   * @returns Observable con las resoluciones enriquecidas con datos de empresa
   */
  getResolucionesConEmpresa(): Observable<ResolucionConEmpresa[]> {
    // console.log removed for production

    return this.getResoluciones().pipe(
      switchMap((resoluciones: Resolucion[]) => {
        return this.enrichResolucionesConEmpresa(resoluciones);
      })
    );
  }

  /**
   * Enriquece las resoluciones con datos de empresa y conteos
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

        // Enriquecer resoluciones con datos de empresa y conteos
        const resolucionesConEmpresa: ResolucionConEmpresa[] = resoluciones.map(resolucion => {
          const empresa = empresaMap.get(resolucion.empresaId);

          const resolucionEnriquecida: ResolucionConEmpresa = {
            ...resolucion,
            // Agregar conteos directos de los arrays existentes
            cantidadRutas: resolucion.rutasAutorizadasIds?.length || 0,
            cantidadVehiculos: resolucion.vehiculosHabilitadosIds?.length || 0
          };

          // Log para debuggear
          // console.log removed for production

          if (empresa) {
            resolucionEnriquecida.empresa = {
              id: empresa.id,
              razonSocial: {
                principal: empresa.razonSocial.principal,
                comercial: empresa.razonSocial.minimo
              },
              ruc: empresa.ruc
            };
          }

          return resolucionEnriquecida;
        });

        // console.log removed for production
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
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production

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
        console.error('Error exporting resoluciones::', error);

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
   * Exporta resoluciones seleccionadas a Excel con columnas visibles
   * @param resoluciones - Resoluciones a exportar (solo las seleccionadas)
   * @param columnasVisibles - Columnas que están visibles en la tabla
   * @returns Observable con el blob del archivo Excel
   */
  exportarResolucionesSeleccionadas(
    resoluciones: ResolucionConEmpresa[], 
    columnasVisibles: string[]
  ): Observable<Blob> {
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production

    return this.generarExcel(resoluciones, columnasVisibles);
  }

  /**
   * Genera archivo Excel con las resoluciones seleccionadas
   */
  private generarExcel(resoluciones: ResolucionConEmpresa[], columnasVisibles: string[]): Observable<Blob> {
    return new Observable(observer => {
      try {
        // Importar xlsx dinámicamente
        import('xlsx').then(XLSX => {
          // Definir mapeo de columnas
          const columnasMap: { [key: string]: { header: string, accessor: (r: ResolucionConEmpresa) => any } } = {
            'nroResolucion': {
              header: 'N° Resolución',
              accessor: (r) => r.nroResolucion
            },
            'empresa': {
              header: 'Empresa',
              accessor: (r) => r.empresa?.razonSocial?.principal || 'Sin empresa'
            },
            'tipoTramite': {
              header: 'Tipo de Trámite',
              accessor: (r) => r.tipoTramite
            },
            'fechaEmision': {
              header: 'Fecha Emisión',
              accessor: (r) => new Date(r.fechaEmision).toLocaleDateString('es-PE')
            },
            'fechaVigenciaInicio': {
              header: 'Vigencia Inicio',
              accessor: (r) => r.fechaVigenciaInicio ? new Date(r.fechaVigenciaInicio).toLocaleDateString('es-PE') : '-'
            },
            'fechaVigenciaFin': {
              header: 'Vigencia Fin',
              accessor: (r) => r.fechaVigenciaFin ? new Date(r.fechaVigenciaFin).toLocaleDateString('es-PE') : '-'
            },
            'aniosVigencia': {
              header: 'Años Vigencia',
              accessor: (r) => r.aniosVigencia ? `${r.aniosVigencia} ${r.aniosVigencia === 1 ? 'año' : 'años'}` : '-'
            },
            'estado': {
              header: 'Estado',
              accessor: (r) => r.estado || 'Sin estado'
            },
            'rutasAutorizadas': {
              header: 'Rutas Autorizadas',
              accessor: (r) => r.cantidadRutas ? `${r.cantidadRutas} rutas` : 'Sin rutas'
            },
            'vehiculosHabilitados': {
              header: 'Vehículos Habilitados',
              accessor: (r) => r.cantidadVehiculos ? `${r.cantidadVehiculos} vehículos` : 'Sin vehículos'
            }
          };

          // Filtrar solo las columnas visibles (excluyendo acciones y selección)
          const columnasExportar = columnasVisibles.filter(col => 
            col !== 'acciones' && col !== 'seleccion' && columnasMap[col]
          );

          // Crear headers
          const headers = columnasExportar.map(col => columnasMap[col].header);

          // Crear filas de datos
          const filas = resoluciones.map(resolucion => 
            columnasExportar.map(col => columnasMap[col].accessor(resolucion))
          );

          // Crear worksheet
          const wsData = [headers, ...filas];
          const ws = XLSX.utils.aoa_to_sheet(wsData);

          // Configurar anchos de columnas
          const colWidths = columnasExportar.map(col => {
            switch (col) {
              case 'nroResolucion': return { wch: 15 };
              case 'empresa': return { wch: 40 };
              case 'tipoTramite': return { wch: 15 };
              case 'fechaEmision': return { wch: 12 };
              case 'fechaVigenciaInicio': return { wch: 12 };
              case 'fechaVigenciaFin': return { wch: 12 };
              case 'aniosVigencia': return { wch: 12 };
              case 'estado': return { wch: 12 };
              case 'rutasAutorizadas': return { wch: 18 };
              case 'vehiculosHabilitados': return { wch: 20 };
              default: return { wch: 15 };
            }
          });
          ws['!cols'] = colWidths;

          // Crear workbook
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Resoluciones');

          // Generar archivo
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });

          observer.next(blob);
          observer.complete();
        });
      } catch (error) {
        console.error('Error generando Excel::', error);
        observer.error(error);
      }
    });
  }

  /**
   * Obtiene estadísticas de resoluciones según los filtros aplicados
   * @param filtros - Filtros para calcular estadísticas
   * @returns Observable con las estadísticas
   */
  getEstadisticasFiltros(filtros: ResolucionFiltros): Observable<EstadisticasResoluciones> {
    // console.log removed for production
    // console.log removed for production

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

        // console.log removed for production
        return estadisticas;
      })
    );
  }

  /**
   * Obtiene información completa de una resolución incluyendo rutas y vehículos
   * @param resolucionId - ID de la resolución
   * @returns Observable con la información completa
   */
  getResolucionCompleta(resolucionId: string): Observable<any> {
    // console.log removed for production
    // console.log removed for production

    return forkJoin({
      resolucion: this.getResolucionById(resolucionId),
      rutas: this.getRutasPorResolucion(resolucionId),
      vehiculos: this.getVehiculosPorResolucion(resolucionId)
    }).pipe(
      map(({ resolucion, rutas, vehiculos }) => ({
        ...resolucion,
        rutasRelacionadas: rutas,
        vehiculosRelacionados: vehiculos,
        cantidadRutas: rutas.length,
        cantidadVehiculos: vehiculos.length
      })),
      catchError(error => {
        console.error('Error obteniendo resolución completa::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene las rutas asociadas a una resolución
   * @param resolucionId - ID de la resolución
   * @returns Observable con las rutas
   */
  getRutasPorResolucion(resolucionId: string): Observable<any[]> {
    const url = `${this.apiUrl}/resoluciones/${resolucionId}/rutas`;
    
    return this.http.get<any[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error obteniendo rutas por resolución::', error);
        // Fallback: retornar array vacío
        return of([]);
      })
    );
  }

  /**
   * Obtiene los vehículos asociados a una resolución
   * @param resolucionId - ID de la resolución
   * @returns Observable con los vehículos
   */
  getVehiculosPorResolucion(resolucionId: string): Observable<any[]> {
    const url = `${this.apiUrl}/resoluciones/${resolucionId}/vehiculos`;
    
    return this.http.get<any[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error obteniendo vehículos por resolución::', error);
        // Fallback: retornar array vacío
        return of([]);
      })
    );
  }

  /**
   * Obtiene estadísticas de relaciones para todas las resoluciones
   * @returns Observable con las estadísticas de relaciones
   */
  getEstadisticasRelaciones(): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/estadisticas/relaciones`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas de relaciones::', error);
        // Fallback: calcular estadísticas localmente
        return this.calcularEstadisticasRelacionesLocal();
      })
    );
  }

  /**
   * Calcula estadísticas de relaciones localmente como fallback
   * @returns Observable con estadísticas calculadas localmente
   */
  private calcularEstadisticasRelacionesLocal(): Observable<any> {
    return this.getResoluciones().pipe(
      map(resoluciones => {
        const estadisticas = {
          totalResoluciones: resoluciones.length,
          resolucionesPadre: resoluciones.filter(r => r.tipoResolucion === 'PADRE').length,
          resolucionesHijo: resoluciones.filter(r => r.tipoResolucion === 'HIJO').length,
          totalRutas: resoluciones.reduce((sum, r) => sum + (r.rutasAutorizadasIds?.length || 0), 0),
          totalVehiculos: resoluciones.reduce((sum, r) => sum + (r.vehiculosHabilitadosIds?.length || 0), 0),
          promedioRutasPorResolucion: 0,
          promedioVehiculosPorResolucion: 0
        };

        if (estadisticas.totalResoluciones > 0) {
          estadisticas.promedioRutasPorResolucion = Math.round(estadisticas.totalRutas / estadisticas.totalResoluciones * 100) / 100;
          estadisticas.promedioVehiculosPorResolucion = Math.round(estadisticas.totalVehiculos / estadisticas.totalResoluciones * 100) / 100;
        }

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
        console.error('Error descargando plantilla de resoluciones::', error);
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
        console.error('Error validando archivo de resoluciones::', error);
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
        console.error('Error procesando carga masiva de resoluciones::', error);
        return throwError(() => new Error('Error al procesar el archivo'));
      })
    );
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA RESOLUCIONES PADRES
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva de resoluciones padres
   */
  descargarPlantillaResolucionesPadres(): Observable<Blob> {
    const url = `${this.apiUrl}/resoluciones/padres/plantilla`;

    return this.http.get(url, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error descargando plantilla de resoluciones padres::', error);
        return throwError(() => new Error('Error al descargar la plantilla de resoluciones padres'));
      })
    );
  }

  /**
   * Validar archivo Excel de resoluciones padres sin procesarlo
   */
  validarArchivoResolucionesPadres(archivo: File): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/padres/validar`;
    const formData = new FormData();
    formData.append('archivo', archivo);

    // Headers sin Content-Type para FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error validando archivo de resoluciones padres::', error);
        return throwError(() => new Error('Error al validar el archivo de resoluciones padres'));
      })
    );
  }

  /**
   * Procesar carga masiva de resoluciones padres desde Excel
   */
  procesarCargaMasivaResolucionesPadres(archivo: File, soloValidar: boolean = false): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/padres/procesar`;
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
        console.error('Error procesando carga masiva de resoluciones padres::', error);
        return throwError(() => new Error('Error al procesar el archivo de resoluciones padres'));
      })
    );
  }

  /**
   * Obtener reporte de estados de resoluciones padres
   */
  obtenerReporteEstadosResolucionesPadres(): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/padres/reporte-estados`;

    return this.http.get(url, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo reporte de estados de resoluciones padres::', error);
        return throwError(() => new Error('Error al obtener el reporte de estados'));
      })
    );
  }

  // ========================================
  // MÉTODOS DE RESTORE/RECUPERACIÓN
  // ========================================

  /**
   * Obtener resoluciones eliminadas recientemente (últimos 30 días)
   */
  getResolucionesEliminadas(limit: number = 50): Observable<any[]> {
    const url = `${this.apiUrl}/resoluciones/eliminadas?limit=${limit}`;

    return this.http.get<any[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error obteniendo resoluciones eliminadas::', error);
        return throwError(() => new Error('Error al obtener resoluciones eliminadas'));
      })
    );
  }

  /**
   * Restaurar una resolución eliminada
   */
  restoreResolucion(resolucionId: string): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/${resolucionId}/restore`;

    return this.http.post(url, {}, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error restaurando resolución::', error);
        return throwError(() => new Error('Error al restaurar la resolución'));
      })
    );
  }

  /**
   * Restaurar múltiples resoluciones eliminadas
   */
  restoreResolucionesMultiples(resolucionesIds: string[]): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/restore-multiple`;

    return this.http.post(url, resolucionesIds, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error restaurando resoluciones múltiples::', error);
        return throwError(() => new Error('Error al restaurar las resoluciones'));
      })
    );
  }
} 
