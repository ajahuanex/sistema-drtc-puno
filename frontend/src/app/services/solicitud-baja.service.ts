import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  SolicitudBaja, 
  SolicitudBajaCreate, 
  SolicitudBajaUpdate, 
  SolicitudBajaFilter,
  EstadoSolicitudBaja,
  MotivoBaja
} from '../models/solicitud-baja.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitudBajaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Crear una nueva solicitud de baja
   */
  crearSolicitudBaja(solicitud: SolicitudBajaCreate): Observable<SolicitudBaja> {
    if (environment.useDataManager) {
      return this.crearSolicitudBajaMock(solicitud);
    }

    return this.http.post<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja`, solicitud, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creando solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener todas las solicitudes de baja con filtros
   */
  getSolicitudesBaja(filtros?: SolicitudBajaFilter): Observable<SolicitudBaja[]> {
    if (environment.useDataManager) {
      return this.getSolicitudesBajaMock(filtros);
    }

    let params = new HttpParams();
    if (filtros) {
      if (filtros.estado?.length) {
        params = params.set('estado', filtros.estado.join(','));
      }
      if (filtros.motivo?.length) {
        params = params.set('motivo', filtros.motivo.join(','));
      }
      if (filtros.fechaDesde) {
        params = params.set('fechaDesde', filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        params = params.set('fechaHasta', filtros.fechaHasta);
      }
      if (filtros.empresaId) {
        params = params.set('empresaId', filtros.empresaId);
      }
      if (filtros.vehiculoPlaca) {
        params = params.set('vehiculoPlaca', filtros.vehiculoPlaca);
      }
      if (filtros.solicitadoPor) {
        params = params.set('solicitadoPor', filtros.solicitadoPor);
      }
    }

    return this.http.get<SolicitudBaja[]>(`${this.apiUrl}/solicitudes-baja`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo solicitudes de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener una solicitud de baja por ID
   */
  getSolicitudBaja(id: string): Observable<SolicitudBaja> {
    if (environment.useDataManager) {
      return this.getSolicitudBajaMock(id);
    }

    return this.http.get<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar una solicitud de baja
   */
  actualizarSolicitudBaja(id: string, actualizacion: SolicitudBajaUpdate): Observable<SolicitudBaja> {
    if (environment.useDataManager) {
      return this.actualizarSolicitudBajaMock(id, actualizacion);
    }

    return this.http.put<SolicitudBaja>(`${this.apiUrl}/solicitudes-baja/${id}`, actualizacion, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error actualizando solicitud de baja:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aprobar una solicitud de baja
   */
  aprobarSolicitudBaja(id: string, observaciones?: string): Observable<SolicitudBaja> {
    const actualizacion: SolicitudBajaUpdate = {
      estado: EstadoSolicitudBaja.APROBADA,
      fechaAprobacion: new Date().toISOString(),
      observaciones,
      aprobadoPor: {
        usuarioId: 'current-user-id', // TODO: Obtener del contexto de usuario
        nombreUsuario: 'Usuario Actual',
        email: 'usuario@example.com'
      }
    };

    return this.actualizarSolicitudBaja(id, actualizacion);
  }

  /**
   * Rechazar una solicitud de baja
   */
  rechazarSolicitudBaja(id: string, observaciones: string): Observable<SolicitudBaja> {
    const actualizacion: SolicitudBajaUpdate = {
      estado: EstadoSolicitudBaja.RECHAZADA,
      fechaRevision: new Date().toISOString(),
      observaciones,
      revisadoPor: {
        usuarioId: 'current-user-id', // TODO: Obtener del contexto de usuario
        nombreUsuario: 'Usuario Actual',
        email: 'usuario@example.com'
      }
    };

    return this.actualizarSolicitudBaja(id, actualizacion);
  }

  /**
   * Cancelar una solicitud de baja
   */
  cancelarSolicitudBaja(id: string): Observable<SolicitudBaja> {
    const actualizacion: SolicitudBajaUpdate = {
      estado: EstadoSolicitudBaja.CANCELADA,
      fechaRevision: new Date().toISOString()
    };

    return this.actualizarSolicitudBaja(id, actualizacion);
  }

  /**
   * Obtener solicitudes de baja por vehículo
   */
  getSolicitudesBajaPorVehiculo(vehiculoId: string): Observable<SolicitudBaja[]> {
    const filtros: SolicitudBajaFilter = {
      vehiculoPlaca: vehiculoId // Nota: Aquí debería ser vehiculoId, pero el filtro usa placa
    };
    return this.getSolicitudesBaja(filtros);
  }

  // ========================================
  // MÉTODOS MOCK PARA DESARROLLO
  // ========================================

  private crearSolicitudBajaMock(solicitud: SolicitudBajaCreate): Observable<SolicitudBaja> {
    const nuevaSolicitud: SolicitudBaja = {
      id: `solicitud-${Date.now()}`,
      vehiculoId: solicitud.vehiculoId,
      vehiculoPlaca: `PLACA-${solicitud.vehiculoId.slice(-4)}`,
      motivo: solicitud.motivo,
      descripcion: solicitud.descripcion,
      fechaSolicitud: solicitud.fechaSolicitud,
      estado: EstadoSolicitudBaja.PENDIENTE,
      solicitadoPor: {
        usuarioId: 'user-123',
        nombreUsuario: 'Usuario Demo',
        email: 'usuario@demo.com'
      },
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };

    return of(nuevaSolicitud).pipe(delay(1000));
  }

  private getSolicitudesBajaMock(filtros?: SolicitudBajaFilter): Observable<SolicitudBaja[]> {
    const solicitudesMock: SolicitudBaja[] = [
      {
        id: 'solicitud-001',
        vehiculoId: 'vehiculo-001',
        vehiculoPlaca: 'ABC-123',
        empresaId: 'empresa-001',
        empresaNombre: 'Transportes Demo S.A.C.',
        motivo: MotivoBaja.DETERIORO,
        descripcion: 'El vehículo presenta deterioro significativo en el motor y carrocería debido al uso intensivo.',
        fechaSolicitud: '2024-12-20T10:00:00Z',
        estado: EstadoSolicitudBaja.PENDIENTE,
        solicitadoPor: {
          usuarioId: 'user-123',
          nombreUsuario: 'Juan Pérez',
          email: 'juan.perez@demo.com'
        },
        fechaCreacion: '2024-12-20T10:00:00Z',
        fechaActualizacion: '2024-12-20T10:00:00Z'
      },
      {
        id: 'solicitud-002',
        vehiculoId: 'vehiculo-002',
        vehiculoPlaca: 'DEF-456',
        empresaId: 'empresa-002',
        empresaNombre: 'Servicios de Transporte Lima',
        motivo: MotivoBaja.ACCIDENTE,
        descripcion: 'Vehículo involucrado en accidente de tránsito con daños totales.',
        fechaSolicitud: '2024-12-18T14:30:00Z',
        fechaRevision: '2024-12-19T09:15:00Z',
        estado: EstadoSolicitudBaja.APROBADA,
        solicitadoPor: {
          usuarioId: 'user-456',
          nombreUsuario: 'María García',
          email: 'maria.garcia@demo.com'
        },
        revisadoPor: {
          usuarioId: 'admin-001',
          nombreUsuario: 'Admin Sistema',
          email: 'admin@sistema.com'
        },
        observaciones: 'Solicitud aprobada. Proceder con la baja definitiva.',
        fechaCreacion: '2024-12-18T14:30:00Z',
        fechaActualizacion: '2024-12-19T09:15:00Z'
      }
    ];

    // Aplicar filtros si existen
    let solicitudesFiltradas = solicitudesMock;

    if (filtros) {
      if (filtros.estado?.length) {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => 
          filtros.estado!.includes(s.estado)
        );
      }
      if (filtros.motivo?.length) {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => 
          filtros.motivo!.includes(s.motivo)
        );
      }
      if (filtros.vehiculoPlaca) {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => 
          s.vehiculoPlaca.toLowerCase().includes(filtros.vehiculoPlaca!.toLowerCase())
        );
      }
    }

    return of(solicitudesFiltradas).pipe(delay(500));
  }

  private getSolicitudBajaMock(id: string): Observable<SolicitudBaja> {
    return this.getSolicitudesBajaMock().pipe(
      map(solicitudes => {
        const solicitud = solicitudes.find(s => s.id === id);
        if (!solicitud) {
          throw new Error('Solicitud de baja no encontrada');
        }
        return solicitud;
      })
    );
  }

  private actualizarSolicitudBajaMock(id: string, actualizacion: SolicitudBajaUpdate): Observable<SolicitudBaja> {
    return this.getSolicitudBajaMock(id).pipe(
      map(solicitud => ({
        ...solicitud,
        ...actualizacion,
        fechaActualizacion: new Date().toISOString()
      })),
      delay(800)
    );
  }
}