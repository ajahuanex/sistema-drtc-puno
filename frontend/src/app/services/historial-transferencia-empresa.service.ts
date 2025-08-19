import { Injectable, inject, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
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

@Injectable({
  providedIn: 'root'
})
export class HistorialTransferenciaEmpresaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/historial-transferencias-empresa`;

  // Estado interno usando BehaviorSubject
  private historialSubject = new BehaviorSubject<HistorialTransferenciaEmpresa[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Estado reactivo usando computed
  historial = computed(() => this.historialSubject.value);
  loading = computed(() => this.loadingSubject.value);
  error = computed(() => this.errorSubject.value);

  /**
   * Obtiene el historial de transferencias con filtros
   */
  obtenerHistorial(filtros: FiltroHistorialTransferenciaEmpresa = {}): Observable<HistorialTransferenciaEmpresa[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

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

    return new Observable(observer => {
      this.http.get<HistorialTransferenciaEmpresa[]>(this.apiUrl, { params }).subscribe({
        next: (historial: HistorialTransferenciaEmpresa[]) => {
          this.historialSubject.next(historial);
          this.loadingSubject.next(false);
          observer.next(historial);
          observer.complete();
        },
        error: (error: any) => {
          this.errorSubject.next(error.message || 'Error al obtener historial de transferencias');
          this.loadingSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Obtiene el historial de transferencias de una empresa específica
   */
  obtenerHistorialEmpresa(empresaId: string, filtros: FiltroHistorialTransferenciaEmpresa = {}): Observable<HistorialTransferenciaEmpresa[]> {
    const filtrosCompletos = { ...filtros, empresaId };
    return this.obtenerHistorial(filtrosCompletos);
  }

  /**
   * Obtiene el historial de transferencias de un vehículo específico
   */
  obtenerHistorialVehiculo(vehiculoId: string): Observable<HistorialTransferenciaEmpresa[]> {
    return this.obtenerHistorial({ vehiculoId });
  }

  /**
   * Obtiene el resumen de transferencias de una empresa
   */
  obtenerResumenTransferencias(empresaId: string): Observable<ResumenTransferenciasEmpresa> {
    return this.http.get<ResumenTransferenciasEmpresa>(`${this.apiUrl}/resumen/${empresaId}`);
  }

  /**
   * Obtiene el dashboard completo de transferencias de una empresa
   */
  obtenerDashboardTransferencias(empresaId: string): Observable<DashboardTransferenciasEmpresa> {
    return this.http.get<DashboardTransferenciasEmpresa>(`${this.apiUrl}/dashboard/${empresaId}`);
  }

  /**
   * Crea un nuevo registro de transferencia
   */
  crearTransferencia(transferencia: HistorialTransferenciaEmpresaCreate): Observable<HistorialTransferenciaEmpresa> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable(observer => {
      this.http.post<HistorialTransferenciaEmpresa>(this.apiUrl, transferencia).subscribe({
        next: (nuevaTransferencia: HistorialTransferenciaEmpresa) => {
          // Actualizar el estado local
          const historialActual = this.historialSubject.value;
          this.historialSubject.next([nuevaTransferencia, ...historialActual]);
          this.loadingSubject.next(false);
          observer.next(nuevaTransferencia);
          observer.complete();
        },
        error: (error: any) => {
          this.errorSubject.next(error.message || 'Error al crear transferencia');
          this.loadingSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Actualiza el estado de una transferencia
   */
  actualizarTransferencia(id: string, actualizacion: HistorialTransferenciaEmpresaUpdate): Observable<HistorialTransferenciaEmpresa> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable(observer => {
      this.http.patch<HistorialTransferenciaEmpresa>(`${this.apiUrl}/${id}`, actualizacion).subscribe({
        next: (transferenciaActualizada: HistorialTransferenciaEmpresa) => {
          // Actualizar el estado local
          const historialActual = this.historialSubject.value;
          const historialActualizado = historialActual.map(t => 
            t.id === id ? transferenciaActualizada : t
          );
          this.historialSubject.next(historialActualizado);
          this.loadingSubject.next(false);
          observer.next(transferenciaActualizada);
          observer.complete();
        },
        error: (error: any) => {
          this.errorSubject.next(error.message || 'Error al actualizar transferencia');
          this.loadingSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Registra una transferencia de vehículo entre empresas
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

    return this.crearTransferencia(transferencia);
  }

  /**
   * Aprueba una transferencia pendiente
   */
  aprobarTransferencia(id: string, observaciones?: string): Observable<HistorialTransferenciaEmpresa> {
    return this.actualizarTransferencia(id, {
      estadoTransferencia: EstadoTransferencia.APROBADA,
      observaciones
    });
  }

  /**
   * Rechaza una transferencia pendiente
   */
  rechazarTransferencia(id: string, motivo: string): Observable<HistorialTransferenciaEmpresa> {
    return this.actualizarTransferencia(id, {
      estadoTransferencia: EstadoTransferencia.RECHAZADA,
      observaciones: motivo
    });
  }

  /**
   * Marca una transferencia como completada
   */
  completarTransferencia(id: string): Observable<HistorialTransferenciaEmpresa> {
    return this.actualizarTransferencia(id, {
      estadoTransferencia: EstadoTransferencia.COMPLETADA
    });
  }

  /**
   * Obtiene las transferencias pendientes de una empresa
   */
  obtenerTransferenciasPendientes(empresaId: string): Observable<HistorialTransferenciaEmpresa[]> {
    return this.obtenerHistorialEmpresa(empresaId, {
      estadoTransferencia: EstadoTransferencia.PENDIENTE
    });
  }

  /**
   * Obtiene las transferencias aprobadas de una empresa
   */
  obtenerTransferenciasAprobadas(empresaId: string): Observable<HistorialTransferenciaEmpresa[]> {
    return this.obtenerHistorialEmpresa(empresaId, {
      estadoTransferencia: EstadoTransferencia.APROBADA
    });
  }

  /**
   * Limpia el estado del servicio
   */
  limpiarEstado(): void {
    this.historialSubject.next([]);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }
} 