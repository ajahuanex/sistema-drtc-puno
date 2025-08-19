import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { 
  Resolucion, 
  BajaVehiculoResolucion, 
  FlujoSustitucionVehiculo, 
  FlujoRenovacionVehiculo,
  TipoTramite,
  TipoBajaResolucion,
  ResolucionBajasEstadisticas
} from '../models/resolucion.model';
import { BajaVehiculo, TipoBajaVehiculo } from '../models/baja-vehiculo.model';
import { Vehiculo } from '../models/vehiculo.model';

@Injectable({
  providedIn: 'root'
})
export class ResolucionBajasIntegrationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = 'http://localhost:8000/api/v1';

  // Estado reactivo para la integración
  private _bajasIntegradas = signal<BajaVehiculoResolucion[]>([]);
  private _flujosSustitucion = signal<FlujoSustitucionVehiculo[]>([]);
  private _flujosRenovacion = signal<FlujoRenovacionVehiculo[]>([]);
  private _estadisticas = signal<ResolucionBajasEstadisticas>({
    totalBajas: 0,
    bajasSustitucion: 0,
    bajasRenovacion: 0,
    bajasIncremento: 0,
    vehiculosSustituidos: 0,
    vehiculosRenovados: 0,
    resolucionesConBajas: 0
  });

  // Computed signals
  bajasIntegradas = this._bajasIntegradas.asReadonly();
  flujosSustitucion = this._flujosSustitucion.asReadonly();
  flujosRenovacion = this._flujosRenovacion.asReadonly();
  estadisticas = this._estadisticas.asReadonly();

  // Computed para filtros
  bajasPorTipo = computed(() => {
    const bajas = this._bajasIntegradas();
    return {
      sustitucion: bajas.filter(b => b.tipoBaja === 'SUSTITUCION_VEHICULO'),
      renovacion: bajas.filter(b => b.tipoBaja === 'RENOVACION_VEHICULO'),
      incremento: bajas.filter(b => b.tipoBaja === 'INCREMENTO_VEHICULO'),
      otros: bajas.filter(b => b.tipoBaja === 'OTROS')
    };
  });

  /**
   * INTEGRACIÓN PARA TRÁMITES DE SUSTITUCIÓN
   */

  /**
   * Procesa una sustitución de vehículo en una resolución
   * - Crea la baja del vehículo anterior
   * - Vincula con la nueva resolución
   * - Actualiza el historial
   */
  procesarSustitucionVehiculo(
    resolucionId: string,
    vehiculoAnteriorId: string,
    vehiculoNuevoId: string,
    motivo: string,
    observaciones?: string,
    archivosSustentatorios?: string[]
  ): Observable<BajaVehiculoResolucion> {
    const flujoSustitucion: FlujoSustitucionVehiculo = {
      resolucionAnteriorId: resolucionId,
      vehiculoAnteriorId,
      motivoSustitucion: motivo,
      fechaSustitucion: new Date(),
      vehiculoNuevoId,
      observaciones,
      archivosSustentatorios
    };

    // TODO: Implementar llamada a API real
    const baja: BajaVehiculoResolucion = {
      id: `baja_${Date.now()}`,
      vehiculoId: vehiculoAnteriorId,
      tipoBaja: 'SUSTITUCION_VEHICULO' as TipoBajaResolucion,
      fechaBaja: new Date(),
      motivo,
      resolucionAnteriorId: resolucionId,
      resolucionNuevaId: resolucionId,
      observaciones,
      archivosSustentatorios,
      estaActivo: true
    };

    return of(baja).pipe(
      tap(baja => {
        // Actualizar estado local
        this._bajasIntegradas.update(bajas => [...bajas, baja]);
        this._flujosSustitucion.update(flujos => [...flujos, flujoSustitucion]);
        this.actualizarEstadisticas();
      })
    );
  }

  /**
   * Procesa una renovación de vehículos en una resolución
   * - Verifica que no haya bajas pendientes
   * - Crea registros de renovación
   * - Vincula con la resolución anterior
   */
  procesarRenovacionVehiculos(
    resolucionId: string,
    resolucionAnteriorId: string,
    vehiculosRenovados: string[],
    motivo: string,
    cambiosRealizados?: string,
    observaciones?: string,
    archivosSustentatorios?: string[]
  ): Observable<BajaVehiculoResolucion[]> {
    const flujoRenovacion: FlujoRenovacionVehiculo = {
      resolucionAnteriorId,
      vehiculosRenovados,
      motivoRenovacion: motivo,
      fechaRenovacion: new Date(),
      cambiosRealizados,
      observaciones,
      archivosSustentatorios
    };

    // Crear bajas para cada vehículo renovado
    const bajasRenovacion: BajaVehiculoResolucion[] = vehiculosRenovados.map(vehiculoId => ({
      id: `renovacion_${vehiculoId}_${Date.now()}`,
      vehiculoId,
      tipoBaja: 'RENOVACION_VEHICULO' as TipoBajaResolucion,
      fechaBaja: new Date(),
      motivo: `Renovación de autorización - ${motivo}`,
      resolucionAnteriorId,
      resolucionNuevaId: resolucionId,
      observaciones: `Renovación: ${observaciones || ''}`,
      archivosSustentatorios,
      estaActivo: true
    }));

    // TODO: Implementar llamada a API real
    return of(bajasRenovacion).pipe(
      tap(bajas => {
        // Actualizar estado local
        this._bajasIntegradas.update(bajasExistentes => [...bajasExistentes, ...bajas]);
        this._flujosRenovacion.update(flujos => [...flujos, flujoRenovacion]);
        this.actualizarEstadisticas();
      })
    );
  }

  /**
   * Verifica si un vehículo puede ser sustituido
   * - No debe tener bajas pendientes
   - Debe estar activo en la resolución actual
   */
  verificarVehiculoSustituible(vehiculoId: string, resolucionId: string): Observable<{
    sustituible: boolean;
    motivo?: string;
    bajasPendientes?: BajaVehiculo[];
  }> {
    // TODO: Implementar verificación real con API
    return of({
      sustituible: true,
      motivo: 'Vehículo disponible para sustitución'
    });
  }

  /**
   * Verifica si una resolución puede ser renovada
   * - No debe tener bajas pendientes
   * - Debe estar próxima a vencer
   * - Debe tener vehículos activos
   */
  verificarResolucionRenovable(resolucionId: string): Observable<{
    renovable: boolean;
    motivo?: string;
    vehiculosActivos?: string[];
    fechaVencimiento?: Date;
  }> {
    // TODO: Implementar verificación real con API
    return of({
      renovable: true,
      motivo: 'Resolución disponible para renovación',
      vehiculosActivos: ['1', '2', '3'],
      fechaVencimiento: new Date('2026-12-31')
    });
  }

  /**
   * Obtiene el historial de sustituciones para una resolución
   */
  obtenerHistorialSustituciones(resolucionId: string): Observable<FlujoSustitucionVehiculo[]> {
    // TODO: Implementar llamada a API real
    return of(this._flujosSustitucion().filter(f => f.resolucionAnteriorId === resolucionId));
  }

  /**
   * Obtiene el historial de renovaciones para una resolución
   */
  obtenerHistorialRenovaciones(resolucionId: string): Observable<FlujoRenovacionVehiculo[]> {
    // TODO: Implementar llamada a API real
    return of(this._flujosRenovacion().filter(f => f.resolucionAnteriorId === resolucionId));
  }

  /**
   * Obtiene todas las bajas integradas para una resolución
   */
  obtenerBajasPorResolucion(resolucionId: string): Observable<BajaVehiculoResolucion[]> {
    // TODO: Implementar llamada a API real
    return of(this._bajasIntegradas().filter(b => 
      b.resolucionAnteriorId === resolucionId || b.resolucionNuevaId === resolucionId
    ));
  }

  /**
   * Obtiene estadísticas de bajas por empresa
   */
  obtenerEstadisticasBajasEmpresa(empresaId: string): Observable<ResolucionBajasEstadisticas> {
    // TODO: Implementar llamada a API real
    return of(this._estadisticas());
  }

  /**
   * Obtiene estadísticas de bajas por tipo de trámite
   */
  obtenerEstadisticasBajasPorTramite(tipoTramite: TipoTramite): Observable<ResolucionBajasEstadisticas> {
    // TODO: Implementar llamada a API real
    const bajas = this._bajasIntegradas();
    
    const estadisticas: ResolucionBajasEstadisticas = {
      totalBajas: bajas.length,
      bajasSustitucion: bajas.filter(b => b.tipoBaja === 'SUSTITUCION_VEHICULO').length,
      bajasRenovacion: bajas.filter(b => b.tipoBaja === 'RENOVACION_VEHICULO').length,
      bajasIncremento: bajas.filter(b => b.tipoBaja === 'INCREMENTO_VEHICULO').length,
      vehiculosSustituidos: bajas.filter(b => b.tipoBaja === 'SUSTITUCION_VEHICULO').length,
      vehiculosRenovados: bajas.filter(b => b.tipoBaja === 'RENOVACION_VEHICULO').length,
      resolucionesConBajas: new Set(bajas.map(b => b.resolucionAnteriorId || b.resolucionNuevaId)).size
    };

    return of(estadisticas);
  }

  /**
   * Actualiza las estadísticas locales
   */
  private actualizarEstadisticas(): void {
    const bajas = this._bajasIntegradas();
    
    const estadisticas: ResolucionBajasEstadisticas = {
      totalBajas: bajas.length,
      bajasSustitucion: bajas.filter(b => b.tipoBaja === 'SUSTITUCION_VEHICULO').length,
      bajasRenovacion: bajas.filter(b => b.tipoBaja === 'RENOVACION_VEHICULO').length,
      bajasIncremento: bajas.filter(b => b.tipoBaja === 'INCREMENTO_VEHICULO').length,
      vehiculosSustituidos: bajas.filter(b => b.tipoBaja === 'SUSTITUCION_VEHICULO').length,
      vehiculosRenovados: bajas.filter(b => b.tipoBaja === 'RENOVACION_VEHICULO').length,
      resolucionesConBajas: new Set(bajas.map(b => b.resolucionAnteriorId || b.resolucionNuevaId)).size
    };

    this._estadisticas.set(estadisticas);
  }

  /**
   * Limpia el estado local (útil para testing)
   */
  limpiarEstado(): void {
    this._bajasIntegradas.set([]);
    this._flujosSustitucion.set([]);
    this._flujosRenovacion.set([]);
    this._estadisticas.set({
      totalBajas: 0,
      bajasSustitucion: 0,
      bajasRenovacion: 0,
      bajasIncremento: 0,
      vehiculosSustituidos: 0,
      vehiculosRenovados: 0,
      resolucionesConBajas: 0
    });
  }
} 