import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Conductor,
  ConductorCreate,
  ConductorUpdate,
  ConductorFiltros,
  ConductorEstadisticas,
  ConductorResumen,
  ConductorHistorial,
  ConductorDocumento,
  ConductorVehiculo,
  ValidacionDni,
  ValidacionLicencia,
  EstadoConductor,
  EstadoLicencia
} from '../models/conductor.model';

@Injectable({
  providedIn: 'root'
})
export class ConductorService {
  private apiUrl = `${environment.apiUrl}/conductores`;
  private conductoresSubject = new BehaviorSubject<Conductor[]>([]);
  private conductorSubject = new BehaviorSubject<Conductor | null>(null);
  private estadisticasSubject = new BehaviorSubject<ConductorEstadisticas | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public conductores$ = this.conductoresSubject.asObservable();
  public conductor$ = this.conductorSubject.asObservable();
  public estadisticas$ = this.estadisticasSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== OPERACIONES CRUD BÁSICAS ====================

  /**
   * Crear nuevo conductor
   */
  createConductor(conductor: ConductorCreate): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<Conductor>(this.apiUrl, conductor).pipe(
      tap(newConductor => {
        this.addConductorToList(newConductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener todos los conductores
   */
  getConductores(skip: number = 0, limit: number = 1000, estado?: string, empresaId?: string): Observable<Conductor[]> {
    // Aumentar el límite para obtener todos los conductores
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (estado) {
      params = params.set('estado', estado);
    }

    if (empresaId) {
      params = params.set('empresa_id', empresaId);
    }

    return this.http.get<Conductor[]>(this.apiUrl, { params }).pipe(
      tap(conductores => {
        this.conductoresSubject.next(conductores);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener conductor por ID
   */
  getConductorById(id: string): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Conductor>(`${this.apiUrl}/${id}`).pipe(
      tap(conductor => {
        this.conductorSubject.next(conductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener conductor por DNI
   */
  getConductorByDni(dni: string): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Conductor>(`${this.apiUrl}/dni/${dni}`).pipe(
      tap(conductor => {
        this.conductorSubject.next(conductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener conductor por número de licencia
   */
  getConductorByLicencia(numeroLicencia: string): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Conductor>(`${this.apiUrl}/licencia/${numeroLicencia}`).pipe(
      tap(conductor => {
        this.conductorSubject.next(conductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar conductor
   */
  updateConductor(id: string, conductor: ConductorUpdate): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.put<Conductor>(`${this.apiUrl}/${id}`, conductor).pipe(
      tap(updatedConductor => {
        this.updateConductorInList(updatedConductor);
        this.conductorSubject.next(updatedConductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar conductor (borrado lógico)
   */
  deleteConductor(id: string): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.removeConductorFromList(id);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  // ==================== FILTROS Y BÚSQUEDAS ====================

  /**
   * Obtener conductores con filtros avanzados
   */
  getConductoresConFiltros(filtros: ConductorFiltros, skip: number = 0, limit: number = 1000): Observable<Conductor[]> {
    // Aumentar el límite para obtener todos los conductores con filtros
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    // Agregar filtros al query string
    Object.keys(filtros).forEach(key => {
      const value = (filtros as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString().split('T')[0]);
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<Conductor[]>(`${this.apiUrl}/filtros`, { params }).pipe(
      tap(conductores => {
        this.conductoresSubject.next(conductores);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Buscar conductores por texto
   */
  searchConductores(query: string): Observable<Conductor[]> {
    if (!query.trim()) {
      return this.getConductores();
    }

    const filtros: ConductorFiltros = {
      dni: query,
      nombres: query,
      apellidoPaterno: query,
      apellidoMaterno: query,
      numeroLicencia: query
    };

    return this.getConductoresConFiltros(filtros);
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas de conductores
   */
  getEstadisticas(): Observable<ConductorEstadisticas> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<ConductorEstadisticas>(`${this.apiUrl}/estadisticas`).pipe(
      tap(estadisticas => {
        this.estadisticasSubject.next(estadisticas);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  // ==================== VALIDACIONES ====================

  /**
   * Validar DNI único
   */
  validarDni(dni: string): Observable<ValidacionDni> {
    return this.http.get<ValidacionDni>(`${this.apiUrl}/validar-dni/${dni}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Validar número de licencia único
   */
  validarLicencia(numeroLicencia: string): Observable<ValidacionLicencia> {
    return this.http.get<ValidacionLicencia>(`${this.apiUrl}/validar-licencia/${numeroLicencia}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // ==================== OPERACIONES ESPECIALES ====================

  /**
   * Cambiar estado del conductor
   */
  cambiarEstadoConductor(id: string, nuevoEstado: EstadoConductor): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.patch<Conductor>(`${this.apiUrl}/${id}/estado`, { nuevoEstado }).pipe(
      tap(conductor => {
        this.updateConductorInList(conductor);
        this.conductorSubject.next(conductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Asignar conductor a empresa
   */
  asignarEmpresa(id: string, empresaId: string, cargo?: string): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    const body: any = { empresaId };
    if (cargo) {
      body.cargo = cargo;
    }

    return this.http.patch<Conductor>(`${this.apiUrl}/${id}/empresa`, body).pipe(
      tap(conductor => {
        this.updateConductorInList(conductor);
        this.conductorSubject.next(conductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Desasignar conductor de empresa
   */
  desasignarEmpresa(id: string): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<Conductor>(`${this.apiUrl}/${id}/empresa`).pipe(
      tap(conductor => {
        this.updateConductorInList(conductor);
        this.conductorSubject.next(conductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verificar licencia del conductor
   */
  verificarLicencia(id: string): Observable<Conductor> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<Conductor>(`${this.apiUrl}/${id}/verificar-licencia`, {}).pipe(
      tap(conductor => {
        this.updateConductorInList(conductor);
        this.conductorSubject.next(conductor);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  // ==================== LICENCIAS ====================

  /**
   * Obtener conductores con licencia por vencer
   */
  getConductoresLicenciaPorVencer(dias: number = 30): Observable<{ dias: number; total: number; conductores: Conductor[] }> {
    this.setLoading(true);
    this.clearError();

    const params = new HttpParams().set('dias', dias.toString());

    return this.http.get<{ dias: number; total: number; conductores: Conductor[] }>(`${this.apiUrl}/licencias/por-vencer`, { params }).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener conductores con licencia vencida
   */
  getConductoresLicenciaVencida(): Observable<{ total: number; conductores: Conductor[] }> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<{ total: number; conductores: Conductor[] }>(`${this.apiUrl}/licencias/vencidas`).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  // ==================== EMPRESAS ====================

  /**
   * Obtener conductores por empresa
   */
  getConductoresPorEmpresa(empresaId: string, skip: number = 0, limit: number = 1000): Observable<Conductor[]> {
    // Aumentar el límite para obtener todos los conductores por empresa
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<Conductor[]>(`${this.apiUrl}/empresa/${empresaId}`, { params }).pipe(
      tap(conductores => {
        this.conductoresSubject.next(conductores);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  // ==================== EXPORTACIÓN ====================

  /**
   * Exportar conductores
   */
  exportarConductores(formato: 'pdf' | 'excel' | 'csv', estado?: string, empresaId?: string): Observable<any> {
    let params = new HttpParams();
    
    if (estado) {
      params = params.set('estado', estado);
    }
    
    if (empresaId) {
      params = params.set('empresa_id', empresaId);
    }

    return this.http.get(`${this.apiUrl}/exportar/${formato}`, { params }).pipe(
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GESTIÓN DE ESTADO LOCAL ====================

  /**
   * Limpiar lista de conductores
   */
  clearConductores(): void {
    this.conductoresSubject.next([]);
  }

  /**
   * Limpiar conductor seleccionado
   */
  clearConductor(): void {
    this.conductorSubject.next(null);
  }

  // ==================== GESTIÓN DE ESTADOS ====================

  /**
   * Establecer estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Limpiar error
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Manejar error
   */
  private handleError(error: any): void {
    this.setLoading(false);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 404) {
      errorMessage = 'Conductor no encontrado';
    } else if (error.status === 400) {
      errorMessage = 'Datos inválidos';
    } else if (error.status === 409) {
      errorMessage = 'El conductor ya existe';
    }
    
    this.errorSubject.next(errorMessage);
  }

  // ==================== GESTIÓN DE LISTA ====================

  /**
   * Agregar conductor a la lista
   */
  private addConductorToList(conductor: Conductor): void {
    const currentConductores = this.conductoresSubject.value;
    this.conductoresSubject.next([...currentConductores, conductor]);
  }

  /**
   * Actualizar conductor en la lista
   */
  private updateConductorInList(conductor: Conductor): void {
    const currentConductores = this.conductoresSubject.value;
    const updatedConductores = currentConductores.map(c => 
      c.id === conductor.id ? conductor : c
    );
    this.conductoresSubject.next(updatedConductores);
  }

  /**
   * Remover conductor de la lista
   */
  private removeConductorFromList(id: string): void {
    const currentConductores = this.conductoresSubject.value;
    const filteredConductores = currentConductores.filter(c => c.id !== id);
    this.conductoresSubject.next(filteredConductores);
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener conductores activos
   */
  getConductoresActivos(): Observable<Conductor[]> {
    return this.getConductores(0, 1000, 'ACTIVO');
  }

  /**
   * Obtener conductores por estado
   */
  getConductoresPorEstado(estado: EstadoConductor): Observable<Conductor[]> {
    return this.getConductores(0, 1000, estado);
  }

  /**
   * Obtener conductores por estado de licencia
   */
  getConductoresPorEstadoLicencia(estadoLicencia: EstadoLicencia): Observable<Conductor[]> {
    const filtros: ConductorFiltros = { estadoLicencia };
    return this.getConductoresConFiltros(filtros);
  }

  /**
   * Refrescar datos
   */
  refresh(): void {
    this.getConductores();
    this.getEstadisticas();
  }

  /**
   * Obtener conductor actual
   */
  getCurrentConductor(): Conductor | null {
    return this.conductorSubject.value;
  }

  /**
   * Obtener lista actual de conductores
   */
  getCurrentConductores(): Conductor[] {
    return this.conductoresSubject.value;
  }

  /**
   * Obtener estadísticas actuales
   */
  getCurrentEstadisticas(): ConductorEstadisticas | null {
    return this.estadisticasSubject.value;
  }
} 