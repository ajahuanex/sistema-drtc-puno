import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Representa un flujo de trabajo completo para el manejo de expedientes
 * entre diferentes oficinas del sistema SIRRET.
 */
export interface FlujoTrabajo {
  id: string;
  nombre: string;
  descripcion: string;
  tipoTramite: string;
  oficinas: OficinaFlujo[];
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  version: string;
  creadoPor: string;
  modificadoPor?: string;
}

/**
 * Representa una oficina dentro de un flujo de trabajo,
 * incluyendo configuraciones específicas para el manejo de expedientes.
 */
export interface OficinaFlujo {
  id: string;
  oficinaId: string;
  orden: number;
  tiempoEstimado: number;
  esObligatoria: boolean;
  puedeRechazar: boolean;
  puedeDevolver: boolean;
  documentosRequeridos: string[];
  condiciones: string[];
  responsableId?: string;
  notificaciones: NotificacionFlujo[];
}

/**
 * Configuración de notificaciones automáticas para una oficina en el flujo.
 */
export interface NotificacionFlujo {
  tipo: 'EMAIL' | 'SMS' | 'SISTEMA';
  destinatario: string;
  momento: 'AL_LLEGAR' | 'AL_SALIR' | 'DIARIA' | 'SEMANAL';
  plantilla: string;
  activa: boolean;
}

/**
 * Representa el movimiento de un expediente entre oficinas,
 * incluyendo toda la información de seguimiento y control.
 */
export interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  flujoId: string;
  oficinaOrigenId?: string;
  oficinaDestinoId: string;
  fechaMovimiento: Date;
  usuarioId: string;
  usuarioNombre: string;
  motivo: string;
  observaciones?: string;
  documentosRequeridos: string[];
  documentosEntregados: string[];
  tiempoEstimado: number;
  prioridad: string;
  urgencia: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO' | 'DEVUELTO';
  fechaLimite: Date;
  fechaCompletado?: Date;
  comentarios?: string;
}

/**
 * Estado actual de un expediente dentro de un flujo de trabajo,
 * incluyendo progreso, historial y recordatorios.
 */
export interface EstadoFlujo {
  expedienteId: string;
  flujoId: string;
  oficinaActualId: string;
  pasoActual: number;
  totalPasos: number;
  porcentajeCompletado: number;
  tiempoTranscurrido: number;
  tiempoEstimado: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO' | 'PAUSADO';
  historial: HistorialPaso[];
  proximaRevision?: Date;
  recordatorios: RecordatorioFlujo[];
}

/**
 * Registro histórico de un paso específico en el flujo de trabajo.
 */
export interface HistorialPaso {
  paso: number;
  oficinaId: string;
  oficinaNombre: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  tiempoEnOficina: number;
  usuarioId: string;
  usuarioNombre: string;
  accion: string;
  comentarios?: string;
  documentos: string[];
  estado: string;
}

/**
 * Recordatorio automático configurado para un flujo de trabajo.
 */
export interface RecordatorioFlujo {
  id: string;
  tipo: 'DIARIO' | 'SEMANAL' | 'PERSONALIZADO';
  mensaje: string;
  fechaCreacion: Date;
  fechaProximo: Date;
  activo: boolean;
  destinatarios: string[];
}

/**
 * Filtros disponibles para la búsqueda y consulta de flujos de trabajo.
 */
export interface FlujoFiltros {
  nombre?: string;
  tipoTramite?: string;
  activo?: boolean;
  oficinaId?: string;
  fechaCreacionDesde?: Date;
  fechaCreacionHasta?: Date;
}

/**
 * Servicio completo para la gestión de flujos de trabajo de expedientes.
 * 
 * Este servicio proporciona funcionalidad completa para:
 * - Gestión de flujos de trabajo (CRUD)
 * - Movimiento de expedientes entre oficinas
 * - Seguimiento de estados y progreso
 * - Generación de reportes y métricas
 * - Notificaciones automáticas
 * - Validaciones de flujo
 * 
 * @example
 * ```typescript
 * // Inyectar el servicio en un componente
 * private flujoService = inject(FlujoTrabajoService);
 * 
 * // Obtener todos los flujos activos
 * this.flujoService.getFlujos({ activo: true }).subscribe(flujos => {
 *   console.log('Flujos activos:', flujos);
 * });
 * 
 * // Mover un expediente a la siguiente oficina
 * const movimiento = {
 *   expedienteId: 'EXP-001',
 *   flujoId: 'FLUJO-001',
 *   oficinaDestinoId: 'OFICINA-002',
 *   usuarioId: 'USER-001',
 *   usuarioNombre: 'Juan Pérez',
 *   motivo: 'Revisión técnica',
 *   // ... otros campos
 * };
 * 
 * this.flujoService.moverExpediente(movimiento).subscribe(resultado => {
 *   console.log('Expediente movido:', resultado);
 * });
 * ```
 * 
 * @since 1.0.0
 * @author Sistema SIRRET
 * 
 * TODO: Integración futura
 * - Conectar con componentes de expedientes para mostrar flujos activos
 * - Integrar con sistema de notificaciones en tiempo real
 * - Implementar cache local con TTL para mejor performance
 * - Agregar soporte para flujos paralelos y condicionales
 * - Implementar métricas avanzadas y dashboards interactivos
 */
@Injectable({
  providedIn: 'root'
})
export class FlujoTrabajoService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/flujos-trabajo`;

  // TODO: Integración futura - Configuración de cache
  // Implementar cache local con TTL para mejorar performance:
  // - Cache de flujos activos (TTL: 5 minutos)
  // - Cache de estados de expedientes (TTL: 1 minuto)
  // - Cache de métricas de dashboard (TTL: 30 segundos)

  // BehaviorSubjects para estado reactivo
  private flujosSubject = new BehaviorSubject<FlujoTrabajo[]>([]);
  private flujoActivoSubject = new BehaviorSubject<FlujoTrabajo | null>(null);
  private movimientosSubject = new BehaviorSubject<MovimientoExpediente[]>([]);
  private estadosSubject = new BehaviorSubject<EstadoFlujo[]>([]);

  // Observables públicos
  flujos$ = this.flujosSubject.asObservable();
  flujoActivo$ = this.flujoActivoSubject.asObservable();
  movimientos$ = this.movimientosSubject.asObservable();
  estados$ = this.estadosSubject.asObservable();

  // TODO: Integración futura - WebSocket para actualizaciones en tiempo real
  // Conectar con WebSocket service para recibir:
  // - Actualizaciones de estado de expedientes
  // - Notificaciones de movimientos
  // - Alertas de flujos bloqueados
  // - Métricas en tiempo real

  // Métodos para Flujos de Trabajo
  
  /**
   * Obtiene una lista de flujos de trabajo con filtros opcionales.
   * 
   * @param filtros - Criterios de filtrado opcionales
   * @returns Observable con la lista de flujos de trabajo
   * 
   * @example
   * ```typescript
   * // Obtener todos los flujos
   * this.flujoService.getFlujos().subscribe(flujos => {
   *   console.log('Todos los flujos:', flujos);
   * });
   * 
   * // Obtener solo flujos activos de un tipo específico
   * this.flujoService.getFlujos({
   *   activo: true,
   *   tipoTramite: 'LICENCIA_CONDUCIR'
   * }).subscribe(flujos => {
   *   console.log('Flujos de licencias activos:', flujos);
   * });
   * ```
   */
  getFlujos(filtros?: FlujoFiltros): Observable<FlujoTrabajo[]> {
    let params = '';
    if (filtros) {
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      params = queryParams.toString();
    }

    const url = params ? `${this.baseUrl}?${params}` : this.baseUrl;
    
    return this.http.get<FlujoTrabajo[]>(url);
  }

  /**
   * Obtiene un flujo de trabajo específico por su ID.
   * 
   * @param id - ID único del flujo de trabajo
   * @returns Observable con el flujo de trabajo solicitado
   * 
   * @example
   * ```typescript
   * this.flujoService.getFlujoById('FLUJO-001').subscribe(flujo => {
   *   console.log('Flujo encontrado:', flujo.nombre);
   *   console.log('Oficinas en el flujo:', flujo.oficinas.length);
   * });
   * ```
   */
  getFlujoById(id: string): Observable<FlujoTrabajo> {
    return this.http.get<FlujoTrabajo>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea un nuevo flujo de trabajo en el sistema.
   * 
   * @param flujo - Datos del flujo de trabajo (sin ID, fechaCreacion, version, creadoPor)
   * @returns Observable con el flujo de trabajo creado
   * 
   * @example
   * ```typescript
   * const nuevoFlujo = {
   *   nombre: 'Proceso de Licencia de Conducir',
   *   descripcion: 'Flujo completo para obtención de licencia',
   *   tipoTramite: 'LICENCIA_CONDUCIR',
   *   activo: true,
   *   oficinas: [
   *     {
   *       id: 'OF-001',
   *       oficinaId: 'MESA_PARTES',
   *       orden: 1,
   *       tiempoEstimado: 30,
   *       esObligatoria: true,
   *       // ... más configuración
   *     }
   *   ]
   * };
   * 
   * this.flujoService.crearFlujo(nuevoFlujo).subscribe(flujoCreado => {
   *   console.log('Flujo creado con ID:', flujoCreado.id);
   * });
   * ```
   */
  crearFlujo(flujo: Omit<FlujoTrabajo, 'id' | 'fechaCreacion' | 'version' | 'creadoPor'>): Observable<FlujoTrabajo> {
    return this.http.post<FlujoTrabajo>(this.baseUrl, flujo);
  }

  actualizarFlujo(id: string, flujo: Partial<FlujoTrabajo>): Observable<FlujoTrabajo> {
    return this.http.put<FlujoTrabajo>(`${this.baseUrl}/${id}`, flujo);
  }

  eliminarFlujo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  activarFlujo(id: string): Observable<FlujoTrabajo> {
    return this.http.patch<FlujoTrabajo>(`${this.baseUrl}/${id}/activar`, {});
  }

  desactivarFlujo(id: string): Observable<FlujoTrabajo> {
    return this.http.patch<FlujoTrabajo>(`${this.baseUrl}/${id}/desactivar`, {});
  }

  // Métodos para Movimientos de Expedientes
  
  /**
   * Obtiene los movimientos de expedientes, opcionalmente filtrados por expediente.
   * 
   * @param expedienteId - ID del expediente para filtrar (opcional)
   * @returns Observable con la lista de movimientos
   * 
   * @example
   * ```typescript
   * // Obtener todos los movimientos
   * this.flujoService.getMovimientos().subscribe(movimientos => {
   *   console.log('Total movimientos:', movimientos.length);
   * });
   * 
   * // Obtener movimientos de un expediente específico
   * this.flujoService.getMovimientos('EXP-001').subscribe(movimientos => {
   *   console.log('Historial del expediente EXP-001:', movimientos);
   * });
   * ```
   */
  getMovimientos(expedienteId?: string): Observable<MovimientoExpediente[]> {
    const url = expedienteId ? `${this.baseUrl}/movimientos?expedienteId=${expedienteId}` : `${this.baseUrl}/movimientos`;
    return this.http.get<MovimientoExpediente[]>(url);
  }

  crearMovimiento(movimiento: Omit<MovimientoExpediente, 'id' | 'fechaMovimiento'>): Observable<MovimientoExpediente> {
    return this.http.post<MovimientoExpediente>(`${this.baseUrl}/movimientos`, movimiento);
  }

  actualizarMovimiento(id: string, movimiento: Partial<MovimientoExpediente>): Observable<MovimientoExpediente> {
    return this.http.put<MovimientoExpediente>(`${this.baseUrl}/movimientos/${id}`, movimiento);
  }

  /**
   * Mueve un expediente de una oficina a otra dentro del flujo de trabajo.
   * Este es el método principal para el seguimiento de expedientes.
   * 
   * @param movimiento - Datos del movimiento (sin ID y fechaMovimiento)
   * @returns Observable con el movimiento registrado
   * 
   * @example
   * ```typescript
   * const movimiento = {
   *   expedienteId: 'EXP-001',
   *   flujoId: 'FLUJO-LICENCIA',
   *   oficinaOrigenId: 'MESA_PARTES',
   *   oficinaDestinoId: 'REVISION_TECNICA',
   *   usuarioId: 'USER-001',
   *   usuarioNombre: 'María García',
   *   motivo: 'Documentos completos, pasa a revisión técnica',
   *   documentosRequeridos: ['DNI', 'CERTIFICADO_MEDICO'],
   *   documentosEntregados: ['DNI', 'CERTIFICADO_MEDICO'],
   *   tiempoEstimado: 60,
   *   prioridad: 'NORMAL',
   *   urgencia: 'BAJA',
   *   estado: 'PENDIENTE',
   *   fechaLimite: new Date('2024-12-31')
   * };
   * 
   * this.flujoService.moverExpediente(movimiento).subscribe(resultado => {
   *   console.log('Expediente movido exitosamente:', resultado.id);
   *   // Actualizar UI o mostrar notificación
   * });
   * ```
   */
  moverExpediente(movimiento: Omit<MovimientoExpediente, 'id' | 'fechaMovimiento'>): Observable<MovimientoExpediente> {
    return this.http.post<MovimientoExpediente>(`${this.baseUrl}/mover-expediente`, movimiento);
  }

  // Métodos para Estados de Flujo
  
  /**
   * Obtiene el estado actual de un expediente en su flujo de trabajo.
   * 
   * @param expedienteId - ID del expediente
   * @returns Observable con el estado completo del flujo
   * 
   * @example
   * ```typescript
   * this.flujoService.getEstadoFlujo('EXP-001').subscribe(estado => {
   *   console.log(`Expediente en oficina: ${estado.oficinaActualId}`);
   *   console.log(`Progreso: ${estado.porcentajeCompletado}%`);
   *   console.log(`Paso ${estado.pasoActual} de ${estado.totalPasos}`);
   *   
   *   // Mostrar historial
   *   estado.historial.forEach(paso => {
   *     console.log(`- ${paso.oficinaNombre}: ${paso.accion}`);
   *   });
   * });
   * ```
   */
  getEstadoFlujo(expedienteId: string): Observable<EstadoFlujo> {
    return this.http.get<EstadoFlujo>(`${this.baseUrl}/estados/${expedienteId}`);
  }

  getEstadosFlujo(filtros?: any): Observable<EstadoFlujo[]> {
    let params = '';
    if (filtros) {
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      params = queryParams.toString();
    }

    const url = params ? `${this.baseUrl}/estados?${params}` : `${this.baseUrl}/estados`;
    return this.http.get<EstadoFlujo[]>(url);
  }

  actualizarEstado(expedienteId: string, estado: Partial<EstadoFlujo>): Observable<EstadoFlujo> {
    return this.http.put<EstadoFlujo>(`${this.baseUrl}/estados/${expedienteId}`, estado);
  }

  // Métodos para Reportes y Analytics
  
  /**
   * Genera un reporte detallado de un flujo de trabajo en un período específico.
   * 
   * @param flujoId - ID del flujo de trabajo
   * @param fechaDesde - Fecha de inicio del período
   * @param fechaHasta - Fecha de fin del período
   * @returns Observable con los datos del reporte
   * 
   * @example
   * ```typescript
   * const fechaDesde = new Date('2024-01-01');
   * const fechaHasta = new Date('2024-01-31');
   * 
   * this.flujoService.getReporteFlujo('FLUJO-001', fechaDesde, fechaHasta)
   *   .subscribe(reporte => {
   *     console.log('Expedientes procesados:', reporte.totalExpedientes);
   *     console.log('Tiempo promedio:', reporte.tiempoPromedio);
   *     console.log('Oficina más lenta:', reporte.cuellosBotella[0]);
   *   });
   * ```
   */
  getReporteFlujo(flujoId: string, fechaDesde: Date, fechaHasta: Date): Observable<any> {
    const params = new URLSearchParams({
      fechaDesde: fechaDesde.toISOString(),
      fechaHasta: fechaHasta.toISOString()
    });
    
    return this.http.get<any>(`${this.baseUrl}/${flujoId}/reporte?${params}`);
  }

  getMetricasFlujo(flujoId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${flujoId}/metricas`);
  }

  /**
   * Obtiene datos para el dashboard principal de flujos de trabajo.
   * Incluye métricas generales, estados actuales y alertas.
   * 
   * @returns Observable con datos del dashboard
   * 
   * @example
   * ```typescript
   * this.flujoService.getDashboardFlujos().subscribe(dashboard => {
   *   console.log('Expedientes activos:', dashboard.expedientesActivos);
   *   console.log('Alertas pendientes:', dashboard.alertas.length);
   *   console.log('Rendimiento general:', dashboard.rendimiento);
   *   
   *   // Actualizar widgets del dashboard
   *   this.actualizarWidgets(dashboard);
   * });
   * ```
   */
  getDashboardFlujos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  // Métodos para Validaciones
  validarFlujo(flujo: FlujoTrabajo): Observable<{ valido: boolean; errores: string[] }> {
    return this.http.post<{ valido: boolean; errores: string[] }>(`${this.baseUrl}/validar`, flujo);
  }

  validarMovimiento(movimiento: MovimientoExpediente): Observable<{ valido: boolean; errores: string[] }> {
    return this.http.post<{ valido: boolean; errores: string[] }>(`${this.baseUrl}/movimientos/validar`, movimiento);
  }

  // Métodos para Notificaciones
  enviarNotificacion(notificacion: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/notificaciones`, notificacion);
  }

  getNotificacionesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notificaciones/pendientes`);
  }

  // Métodos para Cache y Estado Local
  actualizarFlujosLocales(flujos: FlujoTrabajo[]): void {
    this.flujosSubject.next(flujos);
  }

  actualizarMovimientosLocales(movimientos: MovimientoExpediente[]): void {
    this.movimientosSubject.next(movimientos);
  }

  actualizarEstadosLocales(estados: EstadoFlujo[]): void {
    this.estadosSubject.next(estados);
  }

  setFlujoActivo(flujo: FlujoTrabajo | null): void {
    this.flujoActivoSubject.next(flujo);
  }

  // Métodos de Utilidad
  
  /**
   * Calcula el tiempo total estimado para completar un flujo de trabajo.
   * Suma los tiempos estimados de todas las oficinas en el flujo.
   * 
   * @param flujo - Flujo de trabajo a analizar
   * @returns Tiempo total estimado en minutos
   * 
   * @example
   * ```typescript
   * const tiempoTotal = this.flujoService.calcularTiempoEstimado(flujo);
   * console.log(`Tiempo estimado: ${tiempoTotal} minutos`);
   * console.log(`Equivale a: ${Math.round(tiempoTotal / 60)} horas`);
   * ```
   */
  calcularTiempoEstimado(flujo: FlujoTrabajo): number {
    return flujo.oficinas.reduce((total, oficina) => total + oficina.tiempoEstimado, 0);
  }

  /**
   * Obtiene la siguiente oficina en el flujo de trabajo.
   * 
   * @param flujo - Flujo de trabajo
   * @param oficinaActualId - ID de la oficina actual
   * @returns Siguiente oficina en el flujo o null si es la última
   * 
   * @example
   * ```typescript
   * const siguienteOficina = this.flujoService.obtenerOficinaSiguiente(flujo, 'MESA_PARTES');
   * if (siguienteOficina) {
   *   console.log('Siguiente oficina:', siguienteOficina.oficinaId);
   *   console.log('Tiempo estimado:', siguienteOficina.tiempoEstimado);
   * } else {
   *   console.log('Esta es la última oficina del flujo');
   * }
   * ```
   */
  obtenerOficinaSiguiente(flujo: FlujoTrabajo, oficinaActualId: string): OficinaFlujo | null {
    const oficinaActual = flujo.oficinas.find(o => o.oficinaId === oficinaActualId);
    if (!oficinaActual) return null;

    const siguienteOrden = oficinaActual.orden + 1;
    return flujo.oficinas.find(o => o.orden === siguienteOrden) || null;
  }

  obtenerOficinaAnterior(flujo: FlujoTrabajo, oficinaActualId: string): OficinaFlujo | null {
    const oficinaActual = flujo.oficinas.find(o => o.oficinaId === oficinaActualId);
    if (!oficinaActual) return null;

    const anteriorOrden = oficinaActual.orden - 1;
    return flujo.oficinas.find(o => o.orden === anteriorOrden) || null;
  }

  /**
   * Verifica si una oficina es la última en el flujo de trabajo.
   * 
   * @param flujo - Flujo de trabajo
   * @param oficinaId - ID de la oficina a verificar
   * @returns true si es la última oficina, false en caso contrario
   * 
   * @example
   * ```typescript
   * if (this.flujoService.esUltimaOficina(flujo, oficinaActual)) {
   *   console.log('Expediente listo para finalizar');
   *   this.mostrarBotonFinalizar = true;
   * } else {
   *   console.log('Expediente puede continuar al siguiente paso');
   *   this.mostrarBotonSiguiente = true;
   * }
   * ```
   */
  esUltimaOficina(flujo: FlujoTrabajo, oficinaId: string): boolean {
    const oficina = flujo.oficinas.find(o => o.oficinaId === oficinaId);
    if (!oficina) return false;

    const maxOrden = Math.max(...flujo.oficinas.map(o => o.orden));
    return oficina.orden === maxOrden;
  }

  esPrimeraOficina(flujo: FlujoTrabajo, oficinaId: string): boolean {
    const oficina = flujo.oficinas.find(o => o.oficinaId === oficinaId);
    if (!oficina) return false;

    const minOrden = Math.min(...flujo.oficinas.map(o => o.orden));
    return oficina.orden === minOrden;
  }

  // Métodos para Exportación
  
  /**
   * Exporta un flujo de trabajo en el formato especificado.
   * 
   * @param flujoId - ID del flujo de trabajo a exportar
   * @param formato - Formato de exportación (PDF, EXCEL, CSV)
   * @returns Observable con el archivo generado como Blob
   * 
   * @example
   * ```typescript
   * this.flujoService.exportarFlujo('FLUJO-001', 'PDF').subscribe(blob => {
   *   const url = window.URL.createObjectURL(blob);
   *   const link = document.createElement('a');
   *   link.href = url;
   *   link.download = 'flujo-trabajo.pdf';
   *   link.click();
   *   window.URL.revokeObjectURL(url);
   * });
   * ```
   */
  exportarFlujo(flujoId: string, formato: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${flujoId}/exportar?formato=${formato}`, {
      responseType: 'blob'
    });
  }

  exportarReporte(filtros: any, formato: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    const params = new URLSearchParams(filtros);
    return this.http.get(`${this.baseUrl}/exportar-reporte?${params}&formato=${formato}`, {
      responseType: 'blob'
    });
  }

  // TODO: Puntos de integración futura recomendados:
  // 
  // 1. COMPONENTES A INTEGRAR:
  //    - ExpedientesComponent: Mostrar flujo activo de cada expediente
  //    - ExpedienteDetailComponent: Mostrar progreso y historial completo
  //    - OficinasComponent: Gestionar expedientes en cola por oficina
  //    - DashboardComponent: Métricas generales y alertas
  //    - ReportesComponent: Reportes de rendimiento de flujos
  //
  // 2. SERVICIOS RELACIONADOS:
  //    - ExpedienteService: Para obtener datos básicos de expedientes
  //    - UsuarioService: Para validar permisos de movimiento
  //    - NotificacionService: Para alertas en tiempo real
  //    - WebSocketService: Para actualizaciones automáticas
  //
  // 3. GUARDS Y INTERCEPTORS:
  //    - FlujoPermissionGuard: Validar permisos por oficina
  //    - AuditInterceptor: Registrar todos los movimientos
  //    - CacheInterceptor: Cache inteligente de consultas
  //
  // 4. DIRECTIVAS ÚTILES:
  //    - *flujoEstado: Mostrar/ocultar según estado del flujo
  //    - *oficinaPermiso: Mostrar acciones según permisos de oficina
  //    - flujoProgress: Barra de progreso automática
  //
  // 5. PIPES RECOMENDADOS:
  //    - tiempoTranscurrido: Formatear tiempo en formato legible
  //    - estadoFlujo: Traducir estados a texto amigable
  //    - oficinaName: Resolver nombres de oficinas
  //
  // Para comenzar la integración, se recomienda:
  // 1. Inyectar este servicio en ExpedienteDetailComponent
  // 2. Mostrar estado actual del expediente con getEstadoFlujo()
  // 3. Agregar botones de acción según permisos del usuario
  // 4. Implementar modal para mover expediente con moverExpediente()
} 