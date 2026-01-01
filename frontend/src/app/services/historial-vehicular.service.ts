import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, catchError, throwError } from 'rxjs';
import { 
  HistorialVehicular, 
  HistorialVehicularCreate,
  FiltrosHistorialVehicular,
  ResumenHistorialVehicular,
  TipoEventoHistorial,
  EstadoVehiculo,
  ConfiguracionHistorial
} from '../models/historial-vehicular.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistorialVehicularService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = environment.apiUrl;
  
  // Cache para optimizar consultas
  private historialCache = new BehaviorSubject<HistorialVehicular[]>([]);
  private resumenCache = new Map<string, ResumenHistorialVehicular>();

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtiene el historial vehicular con filtros
   */
  getHistorialVehicular(filtros: FiltrosHistorialVehicular): Observable<{
    historial: HistorialVehicular[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Datos de prueba para desarrollo
    const historialPrueba = this.generarHistorialPrueba();
    
    // Aplicar filtros
    let historialFiltrado = historialPrueba;
    
    if (filtros.vehiculoId) {
      historialFiltrado = historialFiltrado.filter(h => h.vehiculoId === filtros.vehiculoId);
    }
    
    if (filtros.placa) {
      historialFiltrado = historialFiltrado.filter(h => 
        h.placa.toLowerCase().includes(filtros.placa!.toLowerCase())
      );
    }
    
    if (filtros.tipoEvento && filtros.tipoEvento.length > 0) {
      historialFiltrado = historialFiltrado.filter(h => 
        filtros.tipoEvento!.includes(h.tipoEvento)
      );
    }
    
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      historialFiltrado = historialFiltrado.filter(h => 
        new Date(h.fechaEvento) >= fechaDesde
      );
    }
    
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      historialFiltrado = historialFiltrado.filter(h => 
        new Date(h.fechaEvento) <= fechaHasta
      );
    }

    // Ordenar por fecha (más reciente primero)
    historialFiltrado.sort((a, b) => 
      new Date(b.fechaEvento).getTime() - new Date(a.fechaEvento).getTime()
    );

    // Paginación
    const page = filtros.page || 1;
    const limit = filtros.limit || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const historialPaginado = historialFiltrado.slice(startIndex, endIndex);

    return of({
      historial: historialPaginado,
      total: historialFiltrado.length,
      page,
      limit
    });
  }

  /**
   * Crea un nuevo registro en el historial
   */
  crearRegistroHistorial(registro: HistorialVehicularCreate): Observable<HistorialVehicular> {
    return this.http.post<HistorialVehicular>(`${this.apiUrl}/historial-vehicular/eventos`, registro, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creando registro de historial:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el resumen del historial de un vehículo específico
   */
  getResumenHistorialVehiculo(vehiculoId: string): Observable<ResumenHistorialVehicular> {
    // Verificar caché primero
    if (this.resumenCache.has(vehiculoId)) {
      return of(this.resumenCache.get(vehiculoId)!);
    }

    // Generar resumen de prueba
    const resumen = this.generarResumenPrueba(vehiculoId);
    this.resumenCache.set(vehiculoId, resumen);
    
    return of(resumen);
  }

  /**
   * Exporta el historial en diferentes formatos
   */
  exportarHistorial(filtros: FiltrosHistorialVehicular, formato: 'excel' | 'pdf' | 'csv' = 'excel'): Observable<Blob> {
    const params = new URLSearchParams();
    
    if (filtros.vehiculoId) params.append('vehiculoId', filtros.vehiculoId);
    if (filtros.placa) params.append('placa', filtros.placa);
    if (filtros.tipoEvento) {
      if (Array.isArray(filtros.tipoEvento)) {
        filtros.tipoEvento.forEach(tipo => params.append('tipoEvento', tipo));
      } else {
        params.append('tipoEvento', filtros.tipoEvento);
      }
    }
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    params.append('formato', formato);

    return this.http.get(`${this.apiUrl}/historial-vehicular/exportar?${params.toString()}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exportando historial:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene la configuración del historial
   */
  getConfiguracionHistorial(): Observable<ConfiguracionHistorial> {
    return this.http.get<ConfiguracionHistorial>(`${this.apiUrl}/configuracion`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo configuración de historial:', error);
          // Retornar configuración por defecto
          return of({
            retencionDias: 2555, // 7 años
            compresionAutomatica: true,
            notificacionesActivas: true,
            auditoriaNivel: 'COMPLETO' as const,
            backupAutomatico: true,
            frecuenciaBackup: 'DIARIO' as const
          } as ConfiguracionHistorial);
        })
      );
  }

  /**
   * Registra la creación de un vehículo
   */
  registrarCreacionVehiculo(
    vehiculoId: string,
    placa: string,
    vehiculoData: any,
    usuarioId?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.CREACION,
      descripcion: `Vehículo ${placa} creado en el sistema`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      observaciones: 'Creación inicial del vehículo'
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Registra transferencia de empresa
   */
  registrarTransferenciaEmpresa(
    vehiculoId: string,
    placa: string,
    empresaOrigenId: string,
    empresaDestinoId: string,
    empresaOrigenNombre: string,
    empresaDestinoNombre: string,
    usuarioId?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.TRANSFERENCIA_EMPRESA,
      descripcion: `Vehículo ${placa} transferido de ${empresaOrigenNombre} a ${empresaDestinoNombre}`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      observaciones: `Transferencia de empresa: ${empresaOrigenId} → ${empresaDestinoId}`
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Registra cambio de estado
   */
  registrarCambioEstado(
    vehiculoId: string,
    placa: string,
    estadoAnterior: EstadoVehiculo,
    estadoNuevo: EstadoVehiculo,
    usuarioId?: string,
    observaciones?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.CAMBIO_ESTADO,
      descripcion: `Estado del vehículo ${placa} cambiado de ${estadoAnterior} a ${estadoNuevo}`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      estadoAnterior,
      estadoNuevo,
      observaciones: observaciones || 'Cambio de estado del vehículo'
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Registra modificación de vehículo
   */
  registrarModificacionVehiculo(
    vehiculoId: string,
    placa: string,
    vehiculoAnterior: any,
    vehiculoNuevo: any,
    usuarioId?: string
  ): Observable<HistorialVehicular> {
    const registro: HistorialVehicularCreate = {
      vehiculoId,
      placa,
      tipoEvento: TipoEventoHistorial.MODIFICACION,
      descripcion: `Vehículo ${placa} modificado`,
      fechaEvento: new Date().toISOString(),
      usuarioId,
      observaciones: 'Modificación de datos del vehículo'
    };

    return this.crearRegistroHistorial(registro);
  }

  /**
   * Limpia la caché
   */
  limpiarCache(): void {
    this.historialCache.next([]);
    this.resumenCache.clear();
  }

  /**
   * Obtiene la caché del historial
   */
  getHistorialCache(): Observable<HistorialVehicular[]> {
    return this.historialCache.asObservable();
  }

  /**
   * Genera datos de prueba para el historial vehicular
   */
  private generarHistorialPrueba(): HistorialVehicular[] {
    const placas = ['ABC-123', 'DEF-456', 'GHI-789', 'JKL-012', 'MNO-345'];
    const usuarios = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Sistema'];
    const empresas = [
      { id: '1', nombre: 'Transportes Lima SAC' },
      { id: '2', nombre: 'Empresa Molina' },
      { id: '3', nombre: 'Transportes Unidos' }
    ];

    const historial: HistorialVehicular[] = [];
    
    // Generar eventos para cada placa
    placas.forEach((placa, index) => {
      const vehiculoId = `vehiculo-${index + 1}`;
      
      // Evento de creación (hace 6 meses)
      const fechaCreacion = new Date();
      fechaCreacion.setMonth(fechaCreacion.getMonth() - 6);
      
      historial.push({
        id: `hist-${vehiculoId}-1`,
        vehiculoId,
        placa,
        tipoEvento: TipoEventoHistorial.CREACION,
        descripcion: `Vehículo ${placa} creado en el sistema`,
        fechaEvento: fechaCreacion.toISOString(),
        usuarioId: 'user-1',
        usuarioNombre: usuarios[0],
        observaciones: 'Creación inicial del vehículo',
        fechaCreacion: fechaCreacion.toISOString()
      });

      // Evento de asignación de empresa (hace 5 meses)
      const fechaAsignacion = new Date();
      fechaAsignacion.setMonth(fechaAsignacion.getMonth() - 5);
      
      historial.push({
        id: `hist-${vehiculoId}-2`,
        vehiculoId,
        placa,
        tipoEvento: TipoEventoHistorial.TRANSFERENCIA_EMPRESA,
        descripcion: `Vehículo ${placa} asignado a ${empresas[index % empresas.length].nombre}`,
        fechaEvento: fechaAsignacion.toISOString(),
        usuarioId: 'user-2',
        usuarioNombre: usuarios[1],
        empresaNuevaId: empresas[index % empresas.length].id,
        empresaNuevaNombre: empresas[index % empresas.length].nombre,
        observaciones: 'Asignación inicial de empresa',
        fechaCreacion: fechaAsignacion.toISOString()
      });

      // Evento de cambio de estado (hace 3 meses)
      const fechaCambioEstado = new Date();
      fechaCambioEstado.setMonth(fechaCambioEstado.getMonth() - 3);
      
      historial.push({
        id: `hist-${vehiculoId}-3`,
        vehiculoId,
        placa,
        tipoEvento: TipoEventoHistorial.CAMBIO_ESTADO,
        descripcion: `Estado del vehículo ${placa} cambiado a ACTIVO`,
        fechaEvento: fechaCambioEstado.toISOString(),
        usuarioId: 'user-3',
        usuarioNombre: usuarios[2],
        estadoAnterior: EstadoVehiculo.INACTIVO,
        estadoNuevo: EstadoVehiculo.ACTIVO,
        observaciones: 'Activación del vehículo tras verificación técnica',
        fechaCreacion: fechaCambioEstado.toISOString()
      });

      // Evento de modificación (hace 1 mes)
      const fechaModificacion = new Date();
      fechaModificacion.setMonth(fechaModificacion.getMonth() - 1);
      
      historial.push({
        id: `hist-${vehiculoId}-4`,
        vehiculoId,
        placa,
        tipoEvento: TipoEventoHistorial.MODIFICACION,
        descripcion: `Datos técnicos del vehículo ${placa} actualizados`,
        fechaEvento: fechaModificacion.toISOString(),
        usuarioId: 'user-4',
        usuarioNombre: usuarios[3],
        observaciones: 'Actualización de datos técnicos y documentación',
        fechaCreacion: fechaModificacion.toISOString()
      });

      // Evento de mantenimiento (hace 2 semanas)
      const fechaMantenimiento = new Date();
      fechaMantenimiento.setDate(fechaMantenimiento.getDate() - 14);
      
      historial.push({
        id: `hist-${vehiculoId}-5`,
        vehiculoId,
        placa,
        tipoEvento: TipoEventoHistorial.MANTENIMIENTO,
        descripcion: `Vehículo ${placa} en mantenimiento preventivo`,
        fechaEvento: fechaMantenimiento.toISOString(),
        usuarioId: 'user-5',
        usuarioNombre: usuarios[4],
        observaciones: 'Mantenimiento preventivo programado',
        fechaCreacion: fechaMantenimiento.toISOString()
      });

      // Evento de revisión técnica (hace 1 semana)
      const fechaRevision = new Date();
      fechaRevision.setDate(fechaRevision.getDate() - 7);
      
      historial.push({
        id: `hist-${vehiculoId}-6`,
        vehiculoId,
        placa,
        tipoEvento: TipoEventoHistorial.REVISION_TECNICA,
        descripcion: `Revisión técnica del vehículo ${placa} completada`,
        fechaEvento: fechaRevision.toISOString(),
        usuarioId: 'user-1',
        usuarioNombre: usuarios[0],
        observaciones: 'Revisión técnica anual aprobada',
        fechaCreacion: fechaRevision.toISOString()
      });
    });

    return historial;
  }

  /**
   * Genera resumen de prueba para un vehículo específico
   */
  private generarResumenPrueba(vehiculoId: string): ResumenHistorialVehicular {
    const historialCompleto = this.generarHistorialPrueba();
    const historialVehiculo = historialCompleto.filter(h => h.vehiculoId === vehiculoId);
    
    if (historialVehiculo.length === 0) {
      return {
        vehiculoId,
        placa: 'ABC-123',
        totalEventos: 0,
        ultimoEvento: undefined,
        eventosPorTipo: {},
        empresasHistoricas: [],
        resolucionesHistoricas: [],
        estadosHistoricos: []
      };
    }

    const placa = historialVehiculo[0].placa;
    const ultimoEvento = historialVehiculo.sort((a, b) => 
      new Date(b.fechaEvento).getTime() - new Date(a.fechaEvento).getTime()
    )[0];

    // Contar eventos por tipo
    const eventosPorTipo: { [key in TipoEventoHistorial]?: number } = {};
    historialVehiculo.forEach(evento => {
      eventosPorTipo[evento.tipoEvento] = (eventosPorTipo[evento.tipoEvento] || 0) + 1;
    });

    return {
      vehiculoId,
      placa,
      totalEventos: historialVehiculo.length,
      ultimoEvento,
      eventosPorTipo,
      empresasHistoricas: [
        {
          empresaId: '1',
          empresaNombre: 'Transportes Lima SAC',
          fechaInicio: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          duracionDias: 150
        }
      ],
      resolucionesHistoricas: [
        {
          resolucionId: 'res-001',
          resolucionNumero: 'R-001-2024',
          fechaInicio: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          duracionDias: 180
        }
      ],
      estadosHistoricos: [
        {
          estado: EstadoVehiculo.ACTIVO,
          fechaInicio: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          duracionDias: 90
        }
      ]
    };
  }
}