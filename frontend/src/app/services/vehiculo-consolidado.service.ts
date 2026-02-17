import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, tap, switchMap, combineLatest, BehaviorSubject } from 'rxjs';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { AuthService } from './auth.service';
import { ConfiguracionService } from './configuracion.service';
import { DataManagerClientService } from './data-manager-client.service';
import { HistorialVehicularService } from './historial-vehicular.service';
import { VehiculoNotificationService } from './vehiculo-notification.service';
import { EmpresaService } from './empresa.service';
import { ResolucionService } from './resolucion.service';
import { TipoEventoHistorial, EstadoVehiculo } from '../models/historial-vehicular.model';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';

// Interfaces para carga masiva
interface VehiculoValidacion {
  fila: number;
  placa: string;
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

interface CargaMasivaResponse {
  total_procesados: number;
  exitosos: number;
  errores: number;
  vehiculos_creados: string[];
  errores_detalle: {
    fila: number;
    placa: string;
    errores: string[];
  }[];
}

// Interfaces para búsqueda
export interface BusquedaSugerencia {
  tipo: 'vehiculo' | 'empresa' | 'resolucion';
  texto: string;
  valor: string;
  icono: string;
  relevancia: number;
  vehiculo?: Vehiculo;
  empresa?: Empresa;
  resolucion?: Resolucion;
}

export interface ResultadoBusquedaGlobal {
  vehiculos: Vehiculo[];
  sugerencias: BusquedaSugerencia[];
  totalResultados: number;
  terminoBusqueda: string;
}

/**
 * SERVICIO CONSOLIDADO DE VEHÍCULOS
 * 
 * Combina funcionalidades de múltiples servicios en una solución unificada
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoConsolidadoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private configuracionService = inject(ConfiguracionService);
  private dataManager = inject(DataManagerClientService);
  private historialService = inject(HistorialVehicularService);
  private vehiculoNotificationService = inject(VehiculoNotificationService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  
  private apiUrl = environment.apiUrl;

  // Sistema de cache inteligente
  private vehiculosCache$ = new BehaviorSubject<Vehiculo[]>([]);
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
    vehiculos: false,
    busqueda: false,
    estadisticas: false,
    cargaMasiva: false
  };

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

  private updateCache(vehiculos: Vehiculo[]): void {
    this.vehiculosCache$.next(vehiculos);
    this.cacheTimestamp = Date.now();
    this.cacheStats.lastUpdate = new Date();
    // console.log removed for production
  }

  // Métodos CRUD básicos
  getVehiculos(forceRefresh: boolean = false): Observable<Vehiculo[]> {
    if (!forceRefresh && this.isCacheValid() && this.vehiculosCache$.value.length > 0) {
      this.cacheStats.hits++;
      // console.log removed for production
      return this.vehiculosCache$.asObservable();
    }

    if (this.loadingStates.vehiculos) {
      // console.log removed for production
      return this.vehiculosCache$.asObservable();
    }

    this.loadingStates.vehiculos = true;
    this.cacheStats.misses++;

    // console.log removed for production
    
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, {
      headers: this.getHeaders()
    }).pipe(
      tap(vehiculos => {
        this.updateCache(vehiculos);
        this.loadingStates.vehiculos = false;
        // console.log removed for production
      }),
      catchError(error => {
        this.loadingStates.vehiculos = false;
        console.error('❌ [VEHICULO-CONSOLIDADO] Error obteniendo vehículos::', error);
        return of([]);
      })
    );
  }

  getVehiculo(id: string): Observable<Vehiculo | null> {
    const vehiculoEnCache = this.vehiculosCache$.value.find(v => v.id === id);
    if (vehiculoEnCache && this.isCacheValid()) {
      // console.log removed for production
      return of(vehiculoEnCache);
    }

    // console.log removed for production
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(vehiculo => {
        const vehiculosActuales = this.vehiculosCache$.value;
        const index = vehiculosActuales.findIndex(v => v.id === id);
        if (index >= 0) {
          vehiculosActuales[index] = vehiculo;
        } else {
          vehiculosActuales.push(vehiculo);
        }
        this.updateCache(vehiculosActuales);
      }),
      catchError(error => {
        console.error(`❌ [VEHICULO-CONSOLIDADO] Error obteniendo vehículo ${id}:`, error);
        return of(null);
      })
    );
  }

  createVehiculo(vehiculo: VehiculoCreate): Observable<Vehiculo> {
    // console.log removed for production
    
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehiculos`, vehiculo, {
      headers: this.getHeaders()
    }).pipe(
      switchMap(vehiculoCreado => {
        this.invalidateCache();
        
        return this.historialService.registrarCreacionVehiculo(
          vehiculoCreado.id,
          vehiculoCreado.placa,
          vehiculoCreado
        ).pipe(
          map(() => vehiculoCreado),
          catchError(error => {
            console.error('⚠️ [VEHICULO-CONSOLIDADO] Error registrando historial de creación::', error);
            return of(vehiculoCreado);
          })
        );
      }),
      tap(vehiculoCreado => {
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [VEHICULO-CONSOLIDADO] Error creando vehículo::', error);
        return throwError(() => error);
      })
    );
  }

  updateVehiculo(id: string, vehiculo: VehiculoUpdate): Observable<Vehiculo> {
    return this.getVehiculo(id).pipe(
      switchMap(vehiculoAnterior => {
        if (!vehiculoAnterior) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculo, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(vehiculoActualizado => {
            this.invalidateCache();
            return of(vehiculoActualizado);
          })
        );
      }),
      tap(vehiculoActualizado => {
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [VEHICULO-CONSOLIDADO] Error actualizando vehículo::', error);
        return throwError(() => error);
      })
    );
  }

  deleteVehiculo(id: string): Observable<void> {
    return this.getVehiculo(id).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(() => {
            this.invalidateCache();
            return of(undefined);
          })
        );
      }),
      tap(() => {
        console.log(`✅ [VEHICULO-CONSOLIDADO] Vehículo eliminado (borrado lógico)`);
      }),
      catchError(error => {
        console.error('❌ [VEHICULO-CONSOLIDADO] Error eliminando vehículo::', error);
        return throwError(() => error);
      })
    );
  }

  // Búsqueda inteligente
  buscarGlobal(
    termino: string,
    campos?: ('placa' | 'marca' | 'modelo' | 'empresa' | 'resolucion')[]
  ): Observable<ResultadoBusquedaGlobal> {
    if (!termino || termino.trim().length === 0) {
      return of({
        vehiculos: [],
        sugerencias: [],
        totalResultados: 0,
        terminoBusqueda: ''
      });
    }

    const terminoNormalizado = this.normalizarTermino(termino);
    const camposBusqueda = campos || ['placa', 'marca', 'modelo', 'empresa', 'resolucion'];

    return combineLatest([
      this.getVehiculos(),
      this.empresaService.getEmpresas(),
      this.resolucionService.getResoluciones()
    ]).pipe(
      map(([vehiculos, empresas, resoluciones]) => {
        const resultadosConScore = vehiculos.map(vehiculo => ({
          vehiculo,
          score: this.calcularRelevancia(vehiculo, terminoNormalizado, camposBusqueda, empresas, resoluciones)
        }));

        const vehiculosFiltrados = resultadosConScore
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(r => r.vehiculo);

        const sugerencias = this.generarSugerencias(
          terminoNormalizado,
          vehiculosFiltrados,
          empresas,
          resoluciones
        );

        return {
          vehiculos: vehiculosFiltrados,
          sugerencias,
          totalResultados: vehiculosFiltrados.length,
          terminoBusqueda: termino
        };
      }),
      catchError(error => {
        console.error('❌ [VEHICULO-CONSOLIDADO] Error en búsqueda global::', error);
        return of({
          vehiculos: [],
          sugerencias: [],
          totalResultados: 0,
          terminoBusqueda: termino
        });
      })
    );
  }

  private calcularRelevancia(
    vehiculo: Vehiculo,
    termino: string,
    campos: string[],
    empresas: Empresa[],
    resoluciones: Resolucion[]
  ): number {
    let score = 0;

    if (campos.includes('placa')) {
      const placa = this.normalizarTermino(vehiculo.placa);
      if (placa === termino) {
        score += 100;
      } else if (placa.startsWith(termino)) {
        score += 50;
      } else if (placa.includes(termino)) {
        score += 25;
      }
    }

    if (campos.includes('marca') && vehiculo.marca) {
      const marca = this.normalizarTermino(vehiculo.marca);
      if (marca === termino) {
        score += 70;
      } else if (marca.startsWith(termino)) {
        score += 35;
      } else if (marca.includes(termino)) {
        score += 17;
      }
    }

    return score;
  }

  private generarSugerencias(
    termino: string,
    vehiculos: Vehiculo[],
    empresas: Empresa[],
    resoluciones: Resolucion[]
  ): BusquedaSugerencia[] {
    const sugerencias: BusquedaSugerencia[] = [];

    vehiculos.slice(0, 5).forEach((vehiculo, index) => {
      sugerencias.push({
        tipo: 'vehiculo',
        texto: `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo || ''}`,
        valor: vehiculo.id,
        icono: 'directions_car',
        relevancia: 100 - (index * 10),
        vehiculo
      });
    });

    return sugerencias.sort((a, b) => b.relevancia - a.relevancia);
  }

  private normalizarTermino(termino: string): string {
    return termino
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Gestión de estados
  cambiarEstadoVehiculo(
    vehiculoId: string, 
    nuevoEstado: string, 
    motivo: string, 
    observaciones?: string,
    destinatariosIds: string[] = []
  ): Observable<Vehiculo> {
    // console.log removed for production
    
    return this.getVehiculo(vehiculoId).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        const vehiculoUpdate: VehiculoUpdate = {
          estado: nuevoEstado
        };

        if (nuevoEstado !== 'ACTIVO') {
          vehiculoUpdate.fechaBaja = new Date().toISOString();
          if (motivo) {
            vehiculoUpdate.motivoBaja = motivo;
          }
          if (observaciones) {
            vehiculoUpdate.observacionesBaja = observaciones;
          }
        }

        return this.updateVehiculo(vehiculoId, vehiculoUpdate);
      }),
      tap(vehiculoActualizado => {
        // console.log removed for production
      }),
      catchError(error => {
        console.error('[VEHICULO-CONSOLIDADO] ❌ Error cambiando estado::', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos de utilidad
  validarPlacaExistente(placa: string, vehiculoIdExcluir?: string): Observable<boolean> {
    // console.log removed for production
    
    let url = `${this.apiUrl}/vehiculos/validar-placa/${encodeURIComponent(placa)}`;
    if (vehiculoIdExcluir) {
      url += `?excluir=${vehiculoIdExcluir}`;
    }
    
    return this.http.get<{ existe: boolean }>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.existe),
      catchError(error => {
        console.error('[VEHICULO-CONSOLIDADO] ❌ Error validando placa::', error);
        return of(false);
      })
    );
  }

  verificarPlacaDisponible(placa: string, vehiculoIdActual?: string): Observable<boolean> {
    return this.validarPlacaExistente(placa, vehiculoIdActual).pipe(
      map(existe => !existe)
    );
  }

  getEstadisticasVehiculos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehiculos/estadisticas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('[VEHICULO-CONSOLIDADO] ❌ Error obteniendo estadísticas::', error);
        return of({
          total: 0,
          activos: 0,
          inactivos: 0,
          porEstado: {},
          porEmpresa: {}
        });
      })
    );
  }

  // Herramientas de diagnóstico
  getCacheStats() {
    return {
      ...this.cacheStats,
      isValid: this.isCacheValid(),
      cacheSize: this.vehiculosCache$.value.length,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100 || 0
    };
  }

  clearCache(): void {
    this.invalidateCache();
    this.vehiculosCache$.next([]);
    // console.log removed for production
  }

  getLoadingStates() {
    return { ...this.loadingStates };
  }

  diagnosticar(): Observable<any> {
    return combineLatest([
      this.getVehiculos(),
      this.getEstadisticasVehiculos()
    ]).pipe(
      map(([vehiculos, estadisticas]) => ({
        timestamp: new Date(),
        cache: this.getCacheStats(),
        loading: this.getLoadingStates(),
        vehiculos: {
          total: vehiculos.length,
          estados: this.contarPorEstado(vehiculos),
          empresas: this.contarPorEmpresa(vehiculos)
        },
        estadisticas,
        salud: {
          cacheOperativo: this.isCacheValid(),
          apiConectada: vehiculos.length > 0,
          serviciosAuxiliares: {
            historial: !!this.historialService,
            notificaciones: !!this.vehiculoNotificationService,
            empresas: !!this.empresaService,
            resoluciones: !!this.resolucionService
          }
        }
      })),
      tap(diagnostico => {
        // console.log removed for production
      }),
      catchError(error => {
        console.error('❌ [VEHICULO-CONSOLIDADO] Error en diagnóstico::', error);
        return of({
          timestamp: new Date(),
          error: error.message,
          cache: this.getCacheStats(),
          loading: this.getLoadingStates()
        });
      })
    );
  }

  private contarPorEstado(vehiculos: Vehiculo[]): { [key: string]: number } {
    return vehiculos.reduce((acc, vehiculo) => {
      acc[vehiculo.estado] = (acc[vehiculo.estado] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private contarPorEmpresa(vehiculos: Vehiculo[]): { [key: string]: number } {
    return vehiculos.reduce((acc, vehiculo) => {
      const empresaId = vehiculo.empresaActualId || 'Sin empresa';
      acc[empresaId] = (acc[empresaId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  // Información del servicio
  getServiceInfo() {
    return {
      nombre: 'VehiculoConsolidadoService',
      version: '1.0.0',
      descripcion: 'Servicio consolidado que combina todas las funcionalidades de vehículos',
      funcionalidades: [
        'CRUD básico con cache inteligente',
        'Búsqueda global con ranking de relevancia',
        'Gestión de estados con notificaciones',
        'Historial automático de cambios',
        'Herramientas de diagnóstico'
      ],
      cache: this.getCacheStats(),
      loading: this.getLoadingStates()
    };
  }
}