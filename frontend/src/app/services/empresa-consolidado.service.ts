import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, tap, switchMap, combineLatest, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import {
  Empresa,
  EmpresaCreate,
  EmpresaUpdate,
  EmpresaFiltros,
  EmpresaEstadisticas,
  EstadoEmpresa,
  TipoDocumento,
  EmpresaCambioEstado,
  CambioEstadoEmpresa,
  EmpresaCambioRepresentante,
  CambioRepresentanteLegal,
  RepresentanteLegal,
  EventoHistorialEmpresa,
  TipoEventoEmpresa,
  EmpresaOperacionVehicular,
  EmpresaOperacionRutas
} from '../models/empresa.model';
import {
  HistorialTransferenciaEmpresa,
  HistorialTransferenciaEmpresaCreate,
  HistorialTransferenciaEmpresaUpdate,
  FiltroHistorialTransferenciaEmpresa,
  ResumenTransferenciasEmpresa,
  DashboardTransferenciasEmpresa,
  TipoTransferenciaVehiculo,
  EstadoTransferencia,
  ArchivoSustentatorio
} from '../models/historial-transferencia-empresa.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// Interfaces para búsqueda consolidada
export interface BusquedaSugerenciaEmpresa {
  tipo: 'empresa' | 'ruc' | 'representante';
  texto: string;
  valor: string;
  icono: string;
  relevancia: number;
  empresa?: Empresa;
}

export interface ResultadoBusquedaEmpresa {
  empresas: Empresa[];
  sugerencias: BusquedaSugerenciaEmpresa[];
  totalResultados: number;
  terminoBusqueda: string;
}

/**
 * SERVICIO CONSOLIDADO DE EMPRESAS
 * 
 * Combina funcionalidades de:
 * - EmpresaService (CRUD básico, validaciones, carga masiva)
 * - HistorialTransferenciaEmpresaService (gestión de transferencias)
 * 
 * Características:
 * - Cache inteligente con invalidación automática
 * - Búsqueda global con ranking de relevancia
 * - Gestión completa de transferencias
 * - Validaciones SUNAT integradas
 * - Carga masiva optimizada
 * - Estadísticas en tiempo real
 * - Herramientas de diagnóstico
 */
@Injectable({
  providedIn: 'root'
})
export class EmpresaConsolidadoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  private apiUrl = environment.apiUrl;

  // Sistema de cache inteligente
  private empresasCache$ = new BehaviorSubject<Empresa[]>([]);
  private transferenciasCache$ = new BehaviorSubject<HistorialTransferenciaEmpresa[]>([]);
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    lastUpdate: new Date()
  };

  // Estados de carga
  private loadingStates = {
    empresas: false,
    transferencias: false,
    busqueda: false,
    estadisticas: false,
    cargaMasiva: false,
    validacionSunat: false
  };

  // ========================================
  // MÉTODOS DE UTILIDAD PRIVADOS
  // ========================================

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  private invalidateCache(): void {
    this.cacheTimestamp = 0;
    this.cacheStats.invalidations++;
    // console.log removed for production
  }

  private updateCache(empresas: Empresa[]): void {
    this.empresasCache$.next(empresas);
    this.cacheTimestamp = Date.now();
    this.cacheStats.lastUpdate = new Date();
    // console.log removed for production
  }

  private transformEmpresaData(empresa: any): Empresa {
    return {
      id: empresa.id || empresa._id || '',
      ruc: empresa.ruc || '',
      razonSocial: empresa.razonSocial || empresa.razon_social || {
        principal: '',
        sunat: '',
        minimo: ''
      },
      direccionFiscal: empresa.direccionFiscal || empresa.direccion_fiscal || '',
      estado: empresa.estado || EstadoEmpresa.EN_TRAMITE,
      tiposServicio: empresa.tiposServicio || empresa.tipos_servicio || ['PERSONAS'],
      estaActivo: empresa.estaActivo !== undefined ? empresa.estaActivo : (empresa.esta_activo !== undefined ? empresa.esta_activo : true),
      fechaRegistro: empresa.fechaRegistro || empresa.fecha_registro || new Date(),
      fechaActualizacion: empresa.fechaActualizacion || empresa.fecha_actualizacion || undefined,
      representanteLegal: empresa.representanteLegal || empresa.representante_legal || {
        dni: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        direccion: ''
      },
      emailContacto: empresa.emailContacto || empresa.email_contacto || '',
      telefonoContacto: empresa.telefonoContacto || empresa.telefono_contacto || '',
      sitioWeb: empresa.sitioWeb || empresa.sitio_web || '',
      documentos: empresa.documentos || [],
      auditoria: empresa.auditoria || [],
      historialEventos: empresa.historialEventos || empresa.historial_eventos || [],
      historialEstados: empresa.historialEstados || empresa.historial_estados || [],
      historialRepresentantes: empresa.historialRepresentantes || empresa.historial_representantes || [],
      resolucionesPrimigeniasIds: empresa.resolucionesPrimigeniasIds || empresa.resoluciones_primigenias_ids || [],
      vehiculosHabilitadosIds: empresa.vehiculosHabilitadosIds || empresa.vehiculos_habilitados_ids || [],
      conductoresHabilitadosIds: empresa.conductoresHabilitadosIds || empresa.conductores_habilitados_ids || [],
      rutasAutorizadasIds: empresa.rutasAutorizadasIds || empresa.rutas_autorizadas_ids || [],
      datosSunat: empresa.datosSunat || empresa.datos_sunat || {
        valido: false,
        razonSocial: '',
        estado: '',
        condicion: '',
        direccion: '',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: empresa.ultimaValidacionSunat || empresa.ultima_validacion_sunat || new Date(),
      scoreRiesgo: empresa.scoreRiesgo || empresa.score_riesgo || 0,
      observaciones: empresa.observaciones || '',
      codigoEmpresa: empresa.codigoEmpresa || ''
    };
  }

  // ========================================
  // MÉTODOS CRUD BÁSICOS CONSOLIDADOS
  // ========================================

  /**
   * Obtener todas las empresas con cache inteligente
   */
  getEmpresas(forceRefresh: boolean = false, skip: number = 0, limit: number = 1000): Observable<Empresa[]> {
    if (!forceRefresh && this.isCacheValid() && this.empresasCache$.value.length > 0) {
      this.cacheStats.hits++;
      // console.log removed for production
      return this.empresasCache$.asObservable();
    }

    if (this.loadingStates.empresas) {
      // console.log removed for production
      return this.empresasCache$.asObservable();
    }

    this.loadingStates.empresas = true;
    this.cacheStats.misses++;

    // console.log removed for production
    
    return this.http.get<Empresa[]>(`${this.apiUrl}/empresas?skip=${skip}&limit=${limit}`).pipe(
      map(empresas => {
        // console.log removed for production
        return empresas.map(empresa => this.transformEmpresaData(empresa));
      }),
      tap(empresas => {
        this.updateCache(empresas);
        this.loadingStates.empresas = false;
        // console.log removed for production
      }),
      catchError(error => {
        this.loadingStates.empresas = false;
        console.error('❌ [EMPRESA-CONSOLIDADO] Error obteniendo empresas::', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener empresa por ID con cache
   */
  getEmpresa(id: string): Observable<Empresa | null> {
    // Primero buscar en cache
    const empresaEnCache = this.empresasCache$.value.find(e => e.id === id);
    if (empresaEnCache && this.isCacheValid()) {
      // console.log removed for production
      return of(empresaEnCache);
    }

    // console.log removed for production
    return this.http.get<Empresa>(`${this.apiUrl}/empresas/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      tap(empresa => {
        // Actualizar cache con la empresa obtenida
        const empresasActuales = this.empresasCache$.value;
        const index = empresasActuales.findIndex(e => e.id === id);
        if (index >= 0) {
          empresasActuales[index] = empresa;
        } else {
          empresasActuales.push(empresa);
        }
        this.updateCache(empresasActuales);
      }),
      catchError(error => {
        console.error(`❌ [EMPRESA-CONSOLIDADO] Error obteniendo empresa ${id}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Crear empresa con invalidación de cache
   */
  createEmpresa(empresaData: EmpresaCreate): Observable<Empresa> {
    // console.log removed for production
    
    return this.http.post<Empresa>(`${this.apiUrl}/empresas`, empresaData, {
      headers: this.getHeaders()
    }).pipe(
      tap(empresaCreada => {
        // Invalidar cache
        this.invalidateCache();
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error creando empresa::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar empresa con invalidación de cache
   */
  updateEmpresa(id: string, empresaData: EmpresaUpdate): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/empresas/${id}`, empresaData, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      tap(empresaActualizada => {
        // Invalidar cache
        this.invalidateCache();
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error actualizando empresa::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar empresa con invalidación de cache
   */
  deleteEmpresa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/empresas/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Invalidar cache
        this.invalidateCache();
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error eliminando empresa::', error);
        return throwError(() => error);
      })
    );
  } 
 // ========================================
  // BÚSQUEDA INTELIGENTE CONSOLIDADA
  // ========================================

  /**
   * Búsqueda global inteligente con ranking de relevancia
   */
  buscarGlobal(
    termino: string,
    campos?: ('ruc' | 'razonSocial' | 'representante' | 'codigo')[]
  ): Observable<ResultadoBusquedaEmpresa> {
    if (!termino || termino.trim().length === 0) {
      return of({
        empresas: [],
        sugerencias: [],
        totalResultados: 0,
        terminoBusqueda: ''
      });
    }

    this.loadingStates.busqueda = true;
    const terminoNormalizado = this.normalizarTermino(termino);
    const camposBusqueda = campos || ['ruc', 'razonSocial', 'representante', 'codigo'];

    return this.getEmpresas().pipe(
      map(empresas => {
        // Buscar en empresas con scoring de relevancia
        const resultadosConScore = empresas.map(empresa => ({
          empresa,
          score: this.calcularRelevanciaEmpresa(empresa, terminoNormalizado, camposBusqueda)
        }));

        // Filtrar solo resultados con score > 0 y ordenar por relevancia
        const empresasFiltradas = resultadosConScore
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(r => r.empresa);

        // Generar sugerencias
        const sugerencias = this.generarSugerenciasEmpresa(
          terminoNormalizado,
          empresasFiltradas
        );

        this.loadingStates.busqueda = false;

        return {
          empresas: empresasFiltradas,
          sugerencias,
          totalResultados: empresasFiltradas.length,
          terminoBusqueda: termino
        };
      }),
      catchError(error => {
        this.loadingStates.busqueda = false;
        console.error('❌ [EMPRESA-CONSOLIDADO] Error en búsqueda global::', error);
        return of({
          empresas: [],
          sugerencias: [],
          totalResultados: 0,
          terminoBusqueda: termino
        });
      })
    );
  }

  /**
   * Calcular relevancia de una empresa respecto al término de búsqueda
   */
  private calcularRelevanciaEmpresa(
    empresa: Empresa,
    termino: string,
    campos: string[]
  ): number {
    let score = 0;

    // Búsqueda en RUC (peso: 10 - más importante)
    if (campos.includes('ruc')) {
      const ruc = this.normalizarTermino(empresa.ruc);
      if (ruc === termino) {
        score += 100; // Coincidencia exacta
      } else if (ruc.startsWith(termino)) {
        score += 50; // Comienza con el término
      } else if (ruc.includes(termino)) {
        score += 25; // Contiene el término
      }
    }

    // Búsqueda en razón social (peso: 8)
    if (campos.includes('razonSocial')) {
      const razonSocial = this.normalizarTermino(empresa.razonSocial?.principal || '');
      if (razonSocial === termino) {
        score += 80;
      } else if (razonSocial.startsWith(termino)) {
        score += 40;
      } else if (razonSocial.includes(termino)) {
        score += 20;
      }
    }

    // Búsqueda en representante legal (peso: 6)
    if (campos.includes('representante')) {
      const nombreCompleto = this.normalizarTermino(
        `${empresa.representanteLegal?.nombres || ''} ${empresa.representanteLegal?.apellidos || ''}`
      );
      const dni = this.normalizarTermino(empresa.representanteLegal?.dni || '');
      
      if (nombreCompleto.includes(termino)) {
        score += 30;
      }
      if (dni.includes(termino)) {
        score += 60; // DNI es más específico
      }
    }

    // Búsqueda en código de empresa (peso: 9)
    if (campos.includes('codigo')) {
      const codigo = this.normalizarTermino(empresa.codigoEmpresa || '');
      if (codigo === termino) {
        score += 90;
      } else if (codigo.includes(termino)) {
        score += 45;
      }
    }

    return score;
  }

  /**
   * Generar sugerencias de búsqueda
   */
  private generarSugerenciasEmpresa(
    termino: string,
    empresas: Empresa[]
  ): BusquedaSugerenciaEmpresa[] {
    const sugerencias: BusquedaSugerenciaEmpresa[] = [];

    // Sugerencias de empresas (top 5)
    empresas.slice(0, 5).forEach((empresa, index) => {
      sugerencias.push({
        tipo: 'empresa',
        texto: `${empresa.ruc} - ${empresa.razonSocial?.principal || 'Sin razón social'}`,
        valor: empresa.id,
        icono: 'business',
        relevancia: 100 - (index * 10),
        empresa
      });
    });

    // Sugerencias por RUC
    const empresasPorRuc = empresas.filter(e => 
      this.normalizarTermino(e.ruc).includes(termino)
    ).slice(0, 3);
    
    empresasPorRuc.forEach((empresa, index) => {
      sugerencias.push({
        tipo: 'ruc',
        texto: `RUC: ${empresa.ruc}`,
        valor: empresa.id,
        icono: 'badge',
        relevancia: 80 - (index * 5),
        empresa
      });
    });

    // Sugerencias por representante
    const empresasPorRepresentante = empresas.filter(e => {
      const nombreCompleto = `${e.representanteLegal?.nombres || ''} ${e.representanteLegal?.apellidos || ''}`;
      return this.normalizarTermino(nombreCompleto).includes(termino);
    }).slice(0, 2);

    empresasPorRepresentante.forEach((empresa, index) => {
      sugerencias.push({
        tipo: 'representante',
        texto: `Rep. Legal: ${empresa.representanteLegal?.nombres} ${empresa.representanteLegal?.apellidos}`,
        valor: empresa.id,
        icono: 'person',
        relevancia: 60 - (index * 5),
        empresa
      });
    });

    // Ordenar por relevancia
    return sugerencias.sort((a, b) => b.relevancia - a.relevancia);
  }

  /**
   * Normalizar término de búsqueda
   */
  private normalizarTermino(termino: string): string {
    return termino
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .trim()
      .replace(/\s+/g, ' '); // Normalizar espacios
  }

  // ========================================
  // GESTIÓN DE TRANSFERENCIAS CONSOLIDADA
  // ========================================

  /**
   * Obtener historial de transferencias con filtros
   */
  obtenerHistorialTransferencias(filtros: FiltroHistorialTransferenciaEmpresa = {}): Observable<HistorialTransferenciaEmpresa[]> {
    let params = new HttpParams();
    
    if (filtros.empresaId) params = params.set('empresaId', filtros.empresaId);
    if (filtros.vehiculoId) params = params.set('vehiculoId', filtros.vehiculoId);
    if (filtros.placa) params = params.set('placa', filtros.placa);
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.tipoTransferencia) params = params.set('tipoTransferencia', filtros.tipoTransferencia);
    if (filtros.estadoTransferencia) params = params.set('estadoTransferencia', filtros.estadoTransferencia);
    if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros.tamanoPagina) params = params.set('tamanoPagina', filtros.tamanoPagina.toString());

    return this.http.get<HistorialTransferenciaEmpresa[]>(`${this.apiUrl}/historial-transferencias-empresa`, { 
      params,
      headers: this.getHeaders()
    }).pipe(
      tap(transferencias => {
        this.transferenciasCache$.next(transferencias);
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error obteniendo transferencias::', error);
        return of([]);
      })
    );
  }

  /**
   * Registrar transferencia de vehículo entre empresas
   */
  registrarTransferenciaVehiculo(
    vehiculoId: string,
    empresaOrigenId: string,
    empresaDestinoId: string,
    motivo: string,
    observaciones?: string,
    resolucionId?: string,
    archivosSustentatorios?: ArchivoSustentatorio[],
    tipoTransferencia: TipoTransferenciaVehiculo = TipoTransferenciaVehiculo.TRANSFERENCIA_VOLUNTARIA
  ): Observable<HistorialTransferenciaEmpresa> {
    const transferencia: HistorialTransferenciaEmpresaCreate = {
      empresaOrigenId,
      empresaDestinoId,
      vehiculoId,
      placa: '', // Se llenará desde el servicio
      fechaTransferencia: new Date().toISOString(),
      motivo,
      observaciones,
      resolucionId,
      archivosSustentatorios: archivosSustentatorios || [],
      usuarioId: 'current-user', // Se obtendrá del servicio de autenticación
      tipoTransferencia
    };

    return this.http.post<HistorialTransferenciaEmpresa>(`${this.apiUrl}/historial-transferencias-empresa`, transferencia, {
      headers: this.getHeaders()
    }).pipe(
      tap(nuevaTransferencia => {
        // Actualizar cache de transferencias
        const transferenciasActuales = this.transferenciasCache$.value;
        this.transferenciasCache$.next([nuevaTransferencia, ...transferenciasActuales]);
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error registrando transferencia::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aprobar transferencia pendiente
   */
  aprobarTransferencia(id: string, observaciones?: string): Observable<HistorialTransferenciaEmpresa> {
    return this.actualizarTransferencia(id, {
      estadoTransferencia: EstadoTransferencia.APROBADA,
      observaciones
    });
  }

  /**
   * Rechazar transferencia pendiente
   */
  rechazarTransferencia(id: string, motivo: string): Observable<HistorialTransferenciaEmpresa> {
    return this.actualizarTransferencia(id, {
      estadoTransferencia: EstadoTransferencia.RECHAZADA,
      observaciones: motivo
    });
  }

  /**
   * Actualizar transferencia
   */
  private actualizarTransferencia(id: string, actualizacion: HistorialTransferenciaEmpresaUpdate): Observable<HistorialTransferenciaEmpresa> {
    return this.http.patch<HistorialTransferenciaEmpresa>(`${this.apiUrl}/historial-transferencias-empresa/${id}`, actualizacion, {
      headers: this.getHeaders()
    }).pipe(
      tap(transferenciaActualizada => {
        // Actualizar cache
        const transferenciasActuales = this.transferenciasCache$.value;
        const transferenciasActualizadas = transferenciasActuales.map(t => 
          t.id === id ? transferenciaActualizada : t
        );
        this.transferenciasCache$.next(transferenciasActualizadas);
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error actualizando transferencia::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // VALIDACIONES Y UTILIDADES CONSOLIDADAS
  // ========================================

  /**
   * Validar RUC con SUNAT
   */
  validarEmpresaSunat(ruc: string): Observable<any> {
    if (this.loadingStates.validacionSunat) {
      return throwError(() => new Error('Ya hay una validación SUNAT en progreso'));
    }

    this.loadingStates.validacionSunat = true;
    // console.log removed for production

    return this.http.get(`${this.apiUrl}/empresas/validar-sunat/${ruc}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(resultado => {
        this.loadingStates.validacionSunat = false;
        // console.log removed for production
      }),
      catchError(error => {
        this.loadingStates.validacionSunat = false;
        console.error('❌ [EMPRESA-CONSOLIDADO] Error validando empresa con SUNAT::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Validar RUC existente
   */
  validarRuc(ruc: string): Observable<{ valido: boolean; empresa?: Empresa }> {
    return this.http.get<{ valido: boolean; empresa?: Empresa }>(`${this.apiUrl}/empresas/validar-ruc/${ruc}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error validando RUC::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generar siguiente código de empresa disponible
   */
  generarSiguienteCodigoEmpresa(): Observable<{ siguienteCodigo: string, descripcion: string, formato: string }> {
    return this.http.get<{ siguienteCodigo: string, descripcion: string, formato: string }>(`${this.apiUrl}/empresas/siguiente-codigo`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error generando código de empresa::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Validar código de empresa
   */
  validarCodigoEmpresa(codigo: string): Observable<{
    codigo: string;
    esValido: boolean;
    numeroSecuencial?: number;
    tiposEmpresa?: string[];
    descripcionTipos?: string;
    error?: string;
  }> {
    return this.http.get<{
      codigo: string;
      esValido: boolean;
      numeroSecuencial?: number;
      tiposEmpresa?: string[];
      descripcionTipos?: string;
      error?: string;
    }>(`${this.apiUrl}/empresas/validar-codigo/${codigo}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error validando código de empresa::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // ESTADÍSTICAS CONSOLIDADAS
  // ========================================

  /**
   * Obtener estadísticas completas de empresas
   */
  getEstadisticasEmpresas(): Observable<EmpresaEstadisticas> {
    if (this.loadingStates.estadisticas) {
      // console.log removed for production
      return of({
        totalEmpresas: 0,
        empresasActivas: 0,
        empresasInactivas: 0,
        empresasAutorizadas: 0,
        empresasEnTramite: 0,
        empresasSuspendidas: 0,
        empresasCanceladas: 0,
        empresasConResolucion: 0,
        empresasSinResolucion: 0,
        empresasDadasDeBaja: 0,
        empresasConDocumentosVencidos: 0,
        empresasConScoreAltoRiesgo: 0,
        promedioVehiculosPorEmpresa: 0,
        promedioConductoresPorEmpresa: 0,
        empresasPorEstado: {},
        empresasPorTipo: {},
        crecimientoMensual: []
      } as EmpresaEstadisticas);
    }

    this.loadingStates.estadisticas = true;
    // console.log removed for production
    
    return this.http.get<EmpresaEstadisticas>(`${this.apiUrl}/empresas/estadisticas`).pipe(
      tap(estadisticas => {
        this.loadingStates.estadisticas = false;
        // console.log removed for production
      }),
      catchError(error => {
        this.loadingStates.estadisticas = false;
        console.error('[EMPRESA-CONSOLIDADO] ❌ Error obteniendo estadísticas::', error);
        return of({
          totalEmpresas: 0,
          empresasActivas: 0,
          empresasInactivas: 0,
          empresasAutorizadas: 0,
          empresasEnTramite: 0,
          empresasSuspendidas: 0,
          empresasCanceladas: 0,
          empresasConResolucion: 0,
          empresasSinResolucion: 0,
          empresasDadasDeBaja: 0,
          empresasConDocumentosVencidos: 0,
          empresasConScoreAltoRiesgo: 0,
          promedioVehiculosPorEmpresa: 0,
          promedioConductoresPorEmpresa: 0,
          empresasPorEstado: {},
          empresasPorTipo: {},
          crecimientoMensual: []
        } as EmpresaEstadisticas);
      })
    );
  }

  // ========================================
  // GESTIÓN DE RELACIONES CONSOLIDADA
  // ========================================

  /**
   * Agregar vehículo a empresa
   */
  agregarVehiculoAEmpresa(empresaId: string, vehiculoId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      tap(() => {
        this.invalidateCache();
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error agregando vehículo a empresa::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remover vehículo de empresa
   */
  removerVehiculoDeEmpresa(empresaId: string, vehiculoId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      tap(() => {
        this.invalidateCache();
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error removiendo vehículo de empresa::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener resoluciones de empresa
   */
  getResolucionesEmpresa(empresaId: string, incluirHijas: boolean = true): Observable<any> {
    const params = incluirHijas ? '?incluir_hijas=true' : '?incluir_hijas=false';
    return this.http.get<any>(`${this.apiUrl}/empresas/${empresaId}/resoluciones${params}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error obteniendo resoluciones de empresa::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // CARGA MASIVA CONSOLIDADA
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva
   */
  async descargarPlantillaEmpresas(): Promise<void> {
    if (this.loadingStates.cargaMasiva) {
      throw new Error('Ya hay una operación de carga masiva en progreso');
    }

    this.loadingStates.cargaMasiva = true;
    // console.log removed for production

    try {
      const response = await fetch(`${this.apiUrl}/empresas/carga-masiva/plantilla`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_empresas.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // console.log removed for production
    } catch (error) {
      console.error('❌ [EMPRESA-CONSOLIDADO] Error descargando plantilla::', error);
      throw error;
    } finally {
      this.loadingStates.cargaMasiva = false;
    }
  }

  /**
   * Validar archivo Excel de empresas
   */
  validarArchivoEmpresas(archivo: File): Promise<any> {
    if (this.loadingStates.cargaMasiva) {
      return Promise.reject(new Error('Ya hay una operación de carga masiva en progreso'));
    }

    this.loadingStates.cargaMasiva = true;
    // console.log removed for production

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        this.loadingStates.cargaMasiva = false;
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            // console.log removed for production
            resolve(response);
          } catch (error) {
            reject(new Error('Error al procesar respuesta del servidor'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || 'Error al validar archivo'));
          } catch {
            reject(new Error(`Error del servidor: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        this.loadingStates.cargaMasiva = false;
        reject(new Error('Error de red al validar archivo'));
      };

      xhr.open('POST', `${this.apiUrl}/empresas/carga-masiva/validar`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.authService.getToken()}`);
      xhr.send(formData);
    });
  }

  /**
   * Procesar carga masiva de empresas
   */
  procesarCargaMasivaEmpresas(archivo: File, soloValidar: boolean = false): Promise<any> {
    if (this.loadingStates.cargaMasiva) {
      return Promise.reject(new Error('Ya hay una operación de carga masiva en progreso'));
    }

    this.loadingStates.cargaMasiva = true;
    // console.log removed for production

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        this.loadingStates.cargaMasiva = false;
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (!soloValidar) {
              // Invalidar cache después de carga masiva exitosa
              this.invalidateCache();
            }
            // console.log removed for production
            resolve(response);
          } catch (error) {
            reject(new Error('Error al procesar respuesta del servidor'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || 'Error al procesar archivo'));
          } catch {
            reject(new Error(`Error del servidor: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        this.loadingStates.cargaMasiva = false;
        reject(new Error('Error de red al procesar archivo'));
      };

      const url = `${this.apiUrl}/empresas/carga-masiva/procesar?solo_validar=${soloValidar}`;
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${this.authService.getToken()}`);
      xhr.send(formData);
    });
  }  
// ========================================
  // GESTIÓN DE ESTADOS Y REPRESENTANTES
  // ========================================

  /**
   * Cambiar estado de empresa
   */
  cambiarEstadoEmpresa(empresaId: string, cambioEstado: EmpresaCambioEstado): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/empresas/${empresaId}/cambiar-estado`, cambioEstado, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      tap(() => {
        this.invalidateCache();
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error cambiando estado de empresa::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cambiar representante legal
   */
  cambiarRepresentanteLegal(empresaId: string, cambioRepresentante: EmpresaCambioRepresentante): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/empresas/${empresaId}/cambiar-representante`, cambioRepresentante, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      tap(() => {
        this.invalidateCache();
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error cambiando representante legal::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener historial completo de empresa
   */
  getHistorialCompletoEmpresa(empresaId: string, tipoEvento?: TipoEventoEmpresa, limit: number = 100): Observable<{empresaId: string, eventos: EventoHistorialEmpresa[], estadisticas: any}> {
    let params = new HttpParams().set('limit', limit.toString());
    if (tipoEvento) {
      params = params.set('tipo_evento', tipoEvento);
    }

    return this.http.get<{empresaId: string, eventos: EventoHistorialEmpresa[], estadisticas: any}>(`${this.apiUrl}/empresas/${empresaId}/historial-completo`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error obteniendo historial completo::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // EXPORTACIÓN CONSOLIDADA
  // ========================================

  /**
   * Exportar empresas en diferentes formatos
   */
  exportarEmpresas(formato: 'pdf' | 'excel' | 'csv', empresasSeleccionadas?: string[], columnasVisibles?: string[]): Observable<Blob> {
    let url = `${this.apiUrl}/empresas/exportar/${formato}`;
    const params = new URLSearchParams();
    
    if (empresasSeleccionadas && empresasSeleccionadas.length > 0) {
      params.append('empresas_seleccionadas', empresasSeleccionadas.join(','));
    }
    
    if (columnasVisibles && columnasVisibles.length > 0) {
      params.append('columnas_visibles', columnasVisibles.join(','));
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error exportando empresas::', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // HERRAMIENTAS DE DIAGNÓSTICO
  // ========================================

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      isValid: this.isCacheValid(),
      cacheSize: this.empresasCache$.value.length,
      transferenciasSize: this.transferenciasCache$.value.length,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100 || 0
    };
  }

  /**
   * Limpiar cache manualmente
   */
  clearCache(): void {
    this.invalidateCache();
    this.empresasCache$.next([]);
    this.transferenciasCache$.next([]);
    // console.log removed for production
  }

  /**
   * Obtener estados de carga
   */
  getLoadingStates() {
    return { ...this.loadingStates };
  }

  /**
   * Diagnóstico completo del servicio
   */
  diagnosticar(): Observable<any> {
    // console.log removed for production
    
    return combineLatest([
      this.getEmpresas(),
      this.getEstadisticasEmpresas()
    ]).pipe(
      map(([empresas, estadisticas]) => ({
        timestamp: new Date(),
        cache: this.getCacheStats(),
        loading: this.getLoadingStates(),
        empresas: {
          total: empresas.length,
          estados: this.contarPorEstado(empresas),
          tipos: this.contarPorTipo(empresas)
        },
        estadisticas,
        salud: {
          cacheOperativo: this.isCacheValid(),
          apiConectada: empresas.length > 0,
          serviciosAuxiliares: {
            auth: !!this.authService,
            router: !!this.router
          }
        }
      })),
      tap(diagnostico => {
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [EMPRESA-CONSOLIDADO] Error en diagnóstico::', error);
        return of({
          timestamp: new Date(),
          error: error.message,
          cache: this.getCacheStats(),
          loading: this.getLoadingStates()
        });
      })
    );
  }

  private contarPorEstado(empresas: Empresa[]): { [key: string]: number } {
    return empresas.reduce((acc, empresa) => {
      acc[empresa.estado] = (acc[empresa.estado] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private contarPorTipo(empresas: Empresa[]): { [key: string]: number } {
    return empresas.reduce((acc, empresa) => {
      const tipos = empresa.tiposServicio || ['PERSONAS'];
      tipos.forEach(tipo => {
        acc[tipo] = (acc[tipo] || 0) + 1;
      });
      return acc;
    }, {} as { [key: string]: number });
  }

  // ========================================
  // MÉTODOS DE COMPATIBILIDAD
  // ========================================

  /**
   * Métodos de compatibilidad con la interfaz anterior
   */
  getEmpresasConFiltros(filtros: EmpresaFiltros): Observable<Empresa[]> {
    // Implementar filtrado local o llamada específica al backend
    return this.getEmpresas().pipe(
      map(empresas => this.aplicarFiltrosLocales(empresas, filtros))
    );
  }

  private aplicarFiltrosLocales(empresas: Empresa[], filtros: EmpresaFiltros): Empresa[] {
    return empresas.filter(empresa => {
      if (filtros.ruc && !empresa.ruc.includes(filtros.ruc)) return false;
      if (filtros.razonSocial && !empresa.razonSocial?.principal?.toLowerCase().includes(filtros.razonSocial.toLowerCase())) return false;
      if (filtros.estado && empresa.estado !== filtros.estado) return false;
      if (filtros.fechaDesde && new Date(empresa.fechaRegistro) < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && new Date(empresa.fechaRegistro) > filtros.fechaHasta) return false;
      return true;
    });
  }

  /**
   * Generar número de TUC único
   */
  generarNumeroTuc(): string {
    const año = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `T-${numero}-${año}`;
  }

  // ========================================
  // INFORMACIÓN DEL SERVICIO
  // ========================================

  /**
   * Obtener información del servicio consolidado
   */
  getServiceInfo() {
    return {
      nombre: 'EmpresaConsolidadoService',
      version: '1.0.0',
      descripcion: 'Servicio consolidado que combina todas las funcionalidades de empresas',
      funcionalidades: [
        'CRUD básico con cache inteligente',
        'Búsqueda global con ranking de relevancia',
        'Gestión completa de transferencias',
        'Validaciones SUNAT integradas',
        'Carga masiva optimizada',
        'Estadísticas en tiempo real',
        'Herramientas de diagnóstico'
      ],
      serviciosConsolidados: [
        'EmpresaService',
        'HistorialTransferenciaEmpresaService'
      ],
      cache: this.getCacheStats(),
      loading: this.getLoadingStates()
    };
  }
}