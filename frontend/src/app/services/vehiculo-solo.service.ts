import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

import {
  VehiculoSolo,
  VehiculoSoloCreate,
  VehiculoSoloUpdate,
  VehiculoSoloDetallado,
  VehiculoSoloResponse,
  FiltrosVehiculoSolo,
  HistorialPlaca,
  HistorialPlacaCreate,
  PropietarioRegistral,
  PropietarioRegistralCreate,
  InspeccionTecnica,
  InspeccionTecnicaCreate,
  SeguroVehicular,
  SeguroVehicularCreate,
  DocumentoVehicular,
  DocumentoVehicularCreate,
  ConsultaSUNARP,
  RespuestaSUNARP,
  ConsultaSUTRAN,
  RespuestaSUTRAN,
  EstadisticasVehiculoSolo
} from '../models/vehiculo-solo.model';

@Injectable({
  providedIn: 'root'
})
export class VehiculoSoloService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = `${environment.apiUrl}/vehiculos-solo`;
  
  // Cache
  private vehiculosCache = new BehaviorSubject<VehiculoSolo[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  loading$ = this.loadingSubject.asObservable();
  vehiculos$ = this.vehiculosCache.asObservable();

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ========================================
  // CRUD BÁSICO - VEHICULO SOLO
  // ========================================

  /**
   * Obtener todos los vehículos con filtros
   */
  obtenerVehiculos(filtros?: FiltrosVehiculoSolo): Observable<VehiculoSoloResponse> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        const value = filtros[key as keyof FiltrosVehiculoSolo];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<VehiculoSoloResponse>(this.apiUrl, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      tap(response => {
        this.vehiculosCache.next(response.vehiculos);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error obteniendo vehículos solo:', error);
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }


  /**
   * Obtener un vehículo por ID con todos sus detalles
   */
  obtenerVehiculoPorId(id: string): Observable<VehiculoSolo> {
    return this.http.get<VehiculoSolo>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Buscar vehículo por placa
   */
  buscarPorPlaca(placa: string): Observable<VehiculoSolo | null> {
    return this.http.get<VehiculoSolo>(`${this.apiUrl}/placa/${placa}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        if (error.status === 404) {
          return of(null);
        }
        console.error('Error buscando vehículo por placa:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Buscar vehículo por VIN
   */
  buscarPorVIN(vin: string): Observable<VehiculoSolo | null> {
    return this.http.get<VehiculoSolo>(`${this.apiUrl}/vin/${vin}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        if (error.status === 404) {
          return of(null);
        }
        console.error('Error buscando vehículo por VIN:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear nuevo vehículo
   */
  crearVehiculo(vehiculo: VehiculoSoloCreate): Observable<VehiculoSolo> {
    return this.http.post<VehiculoSolo>(this.apiUrl, vehiculo, {
      headers: this.getHeaders()
    }).pipe(
      tap(nuevoVehiculo => {
        const vehiculosActuales = this.vehiculosCache.value;
        this.vehiculosCache.next([nuevoVehiculo, ...vehiculosActuales]);
      }),
      catchError(error => {
        console.error('Error creando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar vehículo
   */
  actualizarVehiculo(id: string, datos: VehiculoSoloUpdate): Observable<VehiculoSolo> {
    return this.http.put<VehiculoSolo>(`${this.apiUrl}/${id}`, datos, {
      headers: this.getHeaders()
    }).pipe(
      tap(vehiculoActualizado => {
        const vehiculosActuales = this.vehiculosCache.value;
        const index = vehiculosActuales.findIndex(v => v.id === id);
        if (index !== -1) {
          vehiculosActuales[index] = vehiculoActualizado;
          this.vehiculosCache.next([...vehiculosActuales]);
        }
      }),
      catchError(error => {
        console.error('Error actualizando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar vehículo
   */
  eliminarVehiculo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        const vehiculosActuales = this.vehiculosCache.value;
        this.vehiculosCache.next(vehiculosActuales.filter(v => v.id !== id));
      }),
      catchError(error => {
        console.error('Error eliminando vehículo:', error);
        return throwError(() => error);
      })
    );
  }


  // ========================================
  // HISTORIAL DE PLACAS
  // ========================================

  obtenerHistorialPlacas(vehiculoSoloId: string): Observable<HistorialPlaca[]> {
    return this.http.get<HistorialPlaca[]>(`${this.apiUrl}/${vehiculoSoloId}/placas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo historial de placas:', error);
        return of([]);
      })
    );
  }

  registrarCambioPlaca(datos: HistorialPlacaCreate): Observable<HistorialPlaca> {
    return this.http.post<HistorialPlaca>(`${this.apiUrl}/${datos.vehiculoSoloId}/placas`, datos, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error registrando cambio de placa:', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // PROPIETARIOS REGISTRALES
  // ========================================

  obtenerPropietarios(vehiculoSoloId: string): Observable<PropietarioRegistral[]> {
    return this.http.get<PropietarioRegistral[]>(`${this.apiUrl}/${vehiculoSoloId}/propietarios`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo propietarios:', error);
        return of([]);
      })
    );
  }

  registrarPropietario(datos: PropietarioRegistralCreate): Observable<PropietarioRegistral> {
    return this.http.post<PropietarioRegistral>(`${this.apiUrl}/${datos.vehiculoSoloId}/propietarios`, datos, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error registrando propietario:', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // INSPECCIONES TÉCNICAS
  // ========================================

  obtenerInspecciones(vehiculoSoloId: string): Observable<InspeccionTecnica[]> {
    return this.http.get<InspeccionTecnica[]>(`${this.apiUrl}/${vehiculoSoloId}/inspecciones`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo inspecciones:', error);
        return of([]);
      })
    );
  }

  registrarInspeccion(datos: InspeccionTecnicaCreate): Observable<InspeccionTecnica> {
    return this.http.post<InspeccionTecnica>(`${this.apiUrl}/${datos.vehiculoSoloId}/inspecciones`, datos, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error registrando inspección:', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // SEGUROS
  // ========================================

  obtenerSeguros(vehiculoSoloId: string): Observable<SeguroVehicular[]> {
    return this.http.get<SeguroVehicular[]>(`${this.apiUrl}/${vehiculoSoloId}/seguros`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo seguros:', error);
        return of([]);
      })
    );
  }

  registrarSeguro(datos: SeguroVehicularCreate): Observable<SeguroVehicular> {
    return this.http.post<SeguroVehicular>(`${this.apiUrl}/${datos.vehiculoSoloId}/seguros`, datos, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error registrando seguro:', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // DOCUMENTOS
  // ========================================

  obtenerDocumentos(vehiculoSoloId: string): Observable<DocumentoVehicular[]> {
    return this.http.get<DocumentoVehicular[]>(`${this.apiUrl}/${vehiculoSoloId}/documentos`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo documentos:', error);
        return of([]);
      })
    );
  }

  registrarDocumento(datos: DocumentoVehicularCreate): Observable<DocumentoVehicular> {
    return this.http.post<DocumentoVehicular>(`${this.apiUrl}/${datos.vehiculoSoloId}/documentos`, datos, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error registrando documento:', error);
        return throwError(() => error);
      })
    );
  }


  // ========================================
  // INTEGRACIÓN CON APIs EXTERNAS
  // ========================================

  /**
   * Consultar datos en SUNARP
   */
  consultarSUNARP(consulta: ConsultaSUNARP): Observable<RespuestaSUNARP> {
    return this.http.post<RespuestaSUNARP>(`${this.apiUrl}/consultar/sunarp`, consulta, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error consultando SUNARP:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Consultar datos en SUTRAN
   */
  consultarSUTRAN(consulta: ConsultaSUTRAN): Observable<RespuestaSUTRAN> {
    return this.http.post<RespuestaSUTRAN>(`${this.apiUrl}/consultar/sutran`, consulta, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error consultando SUTRAN:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar vehículo desde SUNARP
   */
  actualizarDesdeSUNARP(vehiculoSoloId: string, placa: string): Observable<VehiculoSolo> {
    return this.http.post<VehiculoSolo>(`${this.apiUrl}/${vehiculoSoloId}/actualizar-sunarp`, 
      { placa }, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(vehiculoActualizado => {
        const vehiculosActuales = this.vehiculosCache.value;
        const index = vehiculosActuales.findIndex(v => v.id === vehiculoSoloId);
        if (index !== -1) {
          vehiculosActuales[index] = vehiculoActualizado;
          this.vehiculosCache.next([...vehiculosActuales]);
        }
      }),
      catchError(error => {
        console.error('Error actualizando desde SUNARP:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar vehículo desde SUTRAN
   */
  actualizarDesdeSUTRAN(vehiculoSoloId: string, placa: string): Observable<VehiculoSolo> {
    return this.http.post<VehiculoSolo>(`${this.apiUrl}/${vehiculoSoloId}/actualizar-sutran`, 
      { placa }, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(vehiculoActualizado => {
        const vehiculosActuales = this.vehiculosCache.value;
        const index = vehiculosActuales.findIndex(v => v.id === vehiculoSoloId);
        if (index !== -1) {
          vehiculosActuales[index] = vehiculoActualizado;
          this.vehiculosCache.next([...vehiculosActuales]);
        }
      }),
      catchError(error => {
        console.error('Error actualizando desde SUTRAN:', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // ESTADÍSTICAS Y REPORTES
  // ========================================

  obtenerEstadisticas(): Observable<EstadisticasVehiculoSolo> {
    return this.http.get<EstadisticasVehiculoSolo>(`${this.apiUrl}/estadisticas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Autocompletar placas para búsqueda rápida
   */
  autocompletarPlacas(query: string): Observable<any> {
    const params = new HttpParams().set('q', query).set('limit', '10');
    
    return this.http.get(`${this.apiUrl}/buscar/placas`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error en autocompletado de placas:', error);
        return of({ sugerencias: [] });
      })
    );
  }

  /**
   * Exportar vehículos a Excel
   */
  exportarExcel(filtros?: FiltrosVehiculoSolo): Observable<Blob> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        const value = filtros[key as keyof FiltrosVehiculoSolo];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/exportar/excel`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exportando a Excel:', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // UTILIDADES
  // ========================================

  limpiarCache(): void {
    this.vehiculosCache.next([]);
  }

  /**
   * Verificar si un vehículo tiene inspección vigente
   */
  tieneInspeccionVigente(vehiculoSoloId: string): Observable<boolean> {
    return this.obtenerInspecciones(vehiculoSoloId).pipe(
      map(inspecciones => {
        if (inspecciones.length === 0) return false;
        const hoy = new Date();
        return inspecciones.some(insp => 
          new Date(insp.fechaVencimiento) > hoy && 
          insp.resultado === 'APROBADO'
        );
      })
    );
  }

  /**
   * Verificar si un vehículo tiene SOAT vigente
   */
  tieneSOATVigente(vehiculoSoloId: string): Observable<boolean> {
    return this.obtenerSeguros(vehiculoSoloId).pipe(
      map(seguros => {
        if (seguros.length === 0) return false;
        const hoy = new Date();
        return seguros.some(seg => 
          seg.tipoSeguro === 'SOAT' &&
          new Date(seg.fechaVencimiento) > hoy &&
          seg.estado === 'VIGENTE'
        );
      })
    );
  }
}
