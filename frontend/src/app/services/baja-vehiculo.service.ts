import { Injectable, inject, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BajaVehiculo,
  BajaVehiculoCreate,
  BajaVehiculoUpdate,
  FiltroBajaVehiculo,
  ResumenBajasVehiculo,
  DashboardBajasEmpresa,
  TipoBajaVehiculo,
  EstadoBajaVehiculo,
  BajaVehiculoResumen
} from '../models/baja-vehiculo.model';

@Injectable({
  providedIn: 'root'
})
export class BajaVehiculoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bajas-vehiculos`;

  // Estado interno usando BehaviorSubject
  private bajasSubject = new BehaviorSubject<BajaVehiculo[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Estado reactivo usando computed
  bajas = computed(() => this.bajasSubject.value);
  loading = computed(() => this.loadingSubject.value);
  error = computed(() => this.errorSubject.value);

  /**
   * Obtiene la lista de bajas vehiculares con filtros
   */
  obtenerBajas(filtros: FiltroBajaVehiculo = {}): Observable<BajaVehiculo[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let params = new HttpParams();
    
    if (filtros.empresaId) params = params.set('empresaId', filtros.empresaId);
    if (filtros.vehiculoId) params = params.set('vehiculoId', filtros.vehiculoId);
    if (filtros.placa) params = params.set('placa', filtros.placa);
    if (filtros.tipoBaja) params = params.set('tipoBaja', filtros.tipoBaja);
    if (filtros.estadoBaja) params = params.set('estadoBaja', filtros.estadoBaja);
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros.tamanoPagina) params = params.set('tamanoPagina', filtros.tamanoPagina.toString());

    return new Observable(observer => {
      this.http.get<BajaVehiculo[]>(this.apiUrl, { params }).subscribe({
        next: (bajas: BajaVehiculo[]) => {
          this.bajasSubject.next(bajas);
          this.loadingSubject.next(false);
          observer.next(bajas);
          observer.complete();
        },
        error: (error: any) => {
          this.errorSubject.next(error.message || 'Error al obtener bajas vehiculares');
          this.loadingSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Obtiene las bajas de una empresa específica
   */
  obtenerBajasEmpresa(empresaId: string, filtros: FiltroBajaVehiculo = {}): Observable<BajaVehiculo[]> {
    const filtrosCompletos = { ...filtros, empresaId };
    return this.obtenerBajas(filtrosCompletos);
  }

  /**
   * Obtiene las bajas de un vehículo específico
   */
  obtenerBajasVehiculo(vehiculoId: string): Observable<BajaVehiculo[]> {
    return this.obtenerBajas({ vehiculoId });
  }

  /**
   * Obtiene una baja específica por ID
   */
  obtenerBaja(id: string): Observable<BajaVehiculo> {
    return this.http.get<BajaVehiculo>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene el resumen de bajas de una empresa
   */
  obtenerResumenBajas(empresaId: string): Observable<ResumenBajasVehiculo> {
    return this.http.get<ResumenBajasVehiculo>(`${this.apiUrl}/resumen/${empresaId}`);
  }

  /**
   * Obtiene el dashboard completo de bajas de una empresa
   */
  obtenerDashboardBajas(empresaId: string): Observable<DashboardBajasEmpresa> {
    return this.http.get<DashboardBajasEmpresa>(`${this.apiUrl}/dashboard/${empresaId}`);
  }

  /**
   * Crea una nueva solicitud de baja
   */
  crearBaja(baja: BajaVehiculoCreate): Observable<BajaVehiculo> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable(observer => {
      this.http.post<BajaVehiculo>(this.apiUrl, baja).subscribe({
        next: (nuevaBaja: BajaVehiculo) => {
          // Actualizar el estado local
          const bajasActuales = this.bajasSubject.value;
          this.bajasSubject.next([nuevaBaja, ...bajasActuales]);
          this.loadingSubject.next(false);
          observer.next(nuevaBaja);
          observer.complete();
        },
        error: (error: any) => {
          this.errorSubject.next(error.message || 'Error al crear solicitud de baja');
          this.loadingSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Actualiza una solicitud de baja
   */
  actualizarBaja(id: string, actualizacion: BajaVehiculoUpdate): Observable<BajaVehiculo> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable(observer => {
      this.http.patch<BajaVehiculo>(`${this.apiUrl}/${id}`, actualizacion).subscribe({
        next: (bajaActualizada: BajaVehiculo) => {
          // Actualizar el estado local
          const bajasActuales = this.bajasSubject.value;
          const bajasActualizadas = bajasActuales.map(b => 
            b.id === id ? bajaActualizada : b
          );
          this.bajasSubject.next(bajasActualizadas);
          this.loadingSubject.next(false);
          observer.next(bajaActualizada);
          observer.complete();
        },
        error: (error: any) => {
          this.errorSubject.next(error.message || 'Error al actualizar baja');
          this.loadingSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Aprueba una solicitud de baja
   */
  aprobarBaja(id: string, aprobadoPor: string, observaciones?: string): Observable<BajaVehiculo> {
    return this.actualizarBaja(id, {
      estadoBaja: EstadoBajaVehiculo.APROBADA,
      aprobadoPor,
      fechaAprobacion: new Date().toISOString(),
      observaciones
    });
  }

  /**
   * Rechaza una solicitud de baja
   */
  rechazarBaja(id: string, rechazadoPor: string, motivoRechazo: string): Observable<BajaVehiculo> {
    return this.actualizarBaja(id, {
      estadoBaja: EstadoBajaVehiculo.RECHAZADA,
      rechazadoPor,
      fechaRechazo: new Date().toISOString(),
      motivoRechazo
    });
  }

  /**
   * Marca una baja como en proceso
   */
  iniciarProcesoBaja(id: string): Observable<BajaVehiculo> {
    return this.actualizarBaja(id, {
      estadoBaja: EstadoBajaVehiculo.EN_PROCESO
    });
  }

  /**
   * Marca una baja como completada
   */
  completarBaja(id: string): Observable<BajaVehiculo> {
    return this.actualizarBaja(id, {
      estadoBaja: EstadoBajaVehiculo.COMPLETADA
    });
  }

  /**
   * Cancela una solicitud de baja
   */
  cancelarBaja(id: string, motivo: string): Observable<BajaVehiculo> {
    return this.actualizarBaja(id, {
      estadoBaja: EstadoBajaVehiculo.CANCELADA,
      observaciones: motivo
    });
  }

  /**
   * Suspende temporalmente una baja
   */
  suspenderBaja(id: string, motivo: string): Observable<BajaVehiculo> {
    return this.actualizarBaja(id, {
      estadoBaja: EstadoBajaVehiculo.SUSPENDIDA,
      observaciones: motivo
    });
  }

  /**
   * Obtiene las bajas pendientes de una empresa
   */
  obtenerBajasPendientes(empresaId: string): Observable<BajaVehiculo[]> {
    return this.obtenerBajasEmpresa(empresaId, {
      estadoBaja: EstadoBajaVehiculo.PENDIENTE
    });
  }

  /**
   * Obtiene las bajas aprobadas de una empresa
   */
  obtenerBajasAprobadas(empresaId: string): Observable<BajaVehiculo[]> {
    return this.obtenerBajasEmpresa(empresaId, {
      estadoBaja: EstadoBajaVehiculo.APROBADA
    });
  }

  /**
   * Obtiene las bajas completadas de una empresa
   */
  obtenerBajasCompletadas(empresaId: string): Observable<BajaVehiculo[]> {
    return this.obtenerBajasEmpresa(empresaId, {
      estadoBaja: EstadoBajaVehiculo.COMPLETADA
    });
  }

  /**
   * Obtiene las bajas por tipo específico
   */
  obtenerBajasPorTipo(empresaId: string, tipoBaja: TipoBajaVehiculo): Observable<BajaVehiculo[]> {
    return this.obtenerBajasEmpresa(empresaId, { tipoBaja });
  }

  /**
   * Genera un reporte de bajas para un período específico
   */
  generarReporteBajas(
    empresaId: string, 
    fechaDesde: string, 
    fechaHasta: string
  ): Observable<BajaVehiculo[]> {
    return this.obtenerBajasEmpresa(empresaId, { fechaDesde, fechaHasta });
  }

  /**
   * Obtiene estadísticas de bajas por tipo
   */
  obtenerEstadisticasPorTipo(empresaId: string): Observable<{ [key in TipoBajaVehiculo]: number }> {
    return this.http.get<{ [key in TipoBajaVehiculo]: number }>(`${this.apiUrl}/estadisticas-tipo/${empresaId}`);
  }

  /**
   * Obtiene estadísticas de bajas por estado
   */
  obtenerEstadisticasPorEstado(empresaId: string): Observable<{ [key in EstadoBajaVehiculo]: number }> {
    return this.http.get<{ [key in EstadoBajaVehiculo]: number }>(`${this.apiUrl}/estadisticas-estado/${empresaId}`);
  }

  /**
   * Obtiene el historial de cambios de estado de una baja
   */
  obtenerHistorialEstados(bajaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${bajaId}/historial-estados`);
  }

  /**
   * Limpia el estado del servicio
   */
  limpiarEstado(): void {
    this.bajasSubject.next([]);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }

  /**
   * Obtiene los tipos de baja disponibles
   */
  obtenerTiposBaja(): TipoBajaVehiculo[] {
    return Object.values(TipoBajaVehiculo);
  }

  /**
   * Obtiene los estados de baja disponibles
   */
  obtenerEstadosBaja(): EstadoBajaVehiculo[] {
    return Object.values(EstadoBajaVehiculo);
  }

  /**
   * Obtiene el nombre legible de un tipo de baja
   */
  obtenerNombreTipoBaja(tipo: TipoBajaVehiculo): string {
    const nombres: Record<TipoBajaVehiculo, string> = {
      [TipoBajaVehiculo.SUSTITUCION]: 'Sustitución',
      [TipoBajaVehiculo.VIGENCIA_CADUCADA]: 'Vigencia Caducada',
      [TipoBajaVehiculo.ACCIDENTE_GRAVE]: 'Accidente Grave',
      [TipoBajaVehiculo.VENTA]: 'Venta',
      [TipoBajaVehiculo.DESGUACE]: 'Desguace',
      [TipoBajaVehiculo.ROBO]: 'Robo',
      [TipoBajaVehiculo.INCENDIO]: 'Incendio',
      [TipoBajaVehiculo.INUNDACION]: 'Inundación',
      [TipoBajaVehiculo.OBSOLESCENCIA]: 'Obsolescencia',
      [TipoBajaVehiculo.FALTA_DOCUMENTACION]: 'Falta Documentación',
      [TipoBajaVehiculo.OTRO]: 'Otro'
    };
    return nombres[tipo] || tipo;
  }

  /**
   * Obtiene el nombre legible de un estado de baja
   */
  obtenerNombreEstadoBaja(estado: EstadoBajaVehiculo): string {
    const nombres: Record<EstadoBajaVehiculo, string> = {
      [EstadoBajaVehiculo.PENDIENTE]: 'Pendiente',
      [EstadoBajaVehiculo.APROBADA]: 'Aprobada',
      [EstadoBajaVehiculo.RECHAZADA]: 'Rechazada',
      [EstadoBajaVehiculo.EN_PROCESO]: 'En Proceso',
      [EstadoBajaVehiculo.COMPLETADA]: 'Completada',
      [EstadoBajaVehiculo.CANCELADA]: 'Cancelada',
      [EstadoBajaVehiculo.SUSPENDIDA]: 'Suspendida'
    };
    return nombres[estado] || estado;
  }

  /**
   * Obtiene el color para un tipo de baja
   */
  obtenerColorTipoBaja(tipo: TipoBajaVehiculo): string {
    const colores: Record<TipoBajaVehiculo, string> = {
      [TipoBajaVehiculo.SUSTITUCION]: '#4caf50',
      [TipoBajaVehiculo.VIGENCIA_CADUCADA]: '#ff9800',
      [TipoBajaVehiculo.ACCIDENTE_GRAVE]: '#f44336',
      [TipoBajaVehiculo.VENTA]: '#2196f3',
      [TipoBajaVehiculo.DESGUACE]: '#9c27b0',
      [TipoBajaVehiculo.ROBO]: '#795548',
      [TipoBajaVehiculo.INCENDIO]: '#d32f2f',
      [TipoBajaVehiculo.INUNDACION]: '#1976d2',
      [TipoBajaVehiculo.OBSOLESCENCIA]: '#607d8b',
      [TipoBajaVehiculo.FALTA_DOCUMENTACION]: '#ff5722',
      [TipoBajaVehiculo.OTRO]: '#757575'
    };
    return colores[tipo] || '#757575';
  }

  /**
   * Obtiene el color para un estado de baja
   */
  obtenerColorEstadoBaja(estado: EstadoBajaVehiculo): string {
    const colores: Record<EstadoBajaVehiculo, string> = {
      [EstadoBajaVehiculo.PENDIENTE]: '#ff9800',
      [EstadoBajaVehiculo.APROBADA]: '#4caf50',
      [EstadoBajaVehiculo.RECHAZADA]: '#f44336',
      [EstadoBajaVehiculo.EN_PROCESO]: '#2196f3',
      [EstadoBajaVehiculo.COMPLETADA]: '#4caf50',
      [EstadoBajaVehiculo.CANCELADA]: '#9e9e9e',
      [EstadoBajaVehiculo.SUSPENDIDA]: '#ff9800'
    };
    return colores[estado] || '#757575';
  }
} 