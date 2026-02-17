import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Infraestructura,
  InfraestructuraEstadisticas,
  TipoInfraestructura,
  EstadoInfraestructura,
  FiltrosInfraestructura,
  CrearInfraestructuraRequest,
  ActualizarInfraestructuraRequest,
  CambiarEstadoInfraestructuraRequest,
  InfraestructuraListResponse,
  InfraestructuraResponse
} from '../models/infraestructura.model';

@Injectable({
  providedIn: 'root'
})
export class InfraestructuraService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/infraestructura`;
  
  // Cache y estado
  private infraestructurasCache$ = new BehaviorSubject<Infraestructura[]>([]);
  private estadisticasCache$ = new BehaviorSubject<InfraestructuraEstadisticas | null>(null);
  
  // Observables públicos
  public infraestructuras$ = this.infraestructurasCache$.asObservable();
  public estadisticas$ = this.estadisticasCache$.asObservable();

  // ========================================
  // MÉTODOS CRUD BÁSICOS
  // ========================================

  /**
   * Obtener todas las infraestructuras con paginación y filtros
   */
  getInfraestructuras(
    pagina: number = 0, 
    porPagina: number = 50, 
    filtros?: FiltrosInfraestructura
  ): Observable<Infraestructura[]> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('porPagina', porPagina.toString());

    // Aplicar filtros si existen
    if (filtros) {
      if (filtros.tipoInfraestructura?.length) {
        params = params.set('tipo_infraestructura', filtros.tipoInfraestructura.join(','));
      }
      if (filtros.estado?.length) {
        params = params.set('estado', filtros.estado.join(','));
      }
      if (filtros.capacidadMinima !== undefined) {
        params = params.set('capacidad_minima', filtros.capacidadMinima.toString());
      }
      if (filtros.capacidadMaxima !== undefined) {
        params = params.set('capacidad_maxima', filtros.capacidadMaxima.toString());
      }
      if (filtros.scoreRiesgoMinimo !== undefined) {
        params = params.set('score_riesgo_minimo', filtros.scoreRiesgoMinimo.toString());
      }
      if (filtros.scoreRiesgoMaximo !== undefined) {
        params = params.set('score_riesgo_maximo', filtros.scoreRiesgoMaximo.toString());
      }
      if (filtros.textoBusqueda) {
        params = params.set('busqueda', filtros.textoBusqueda);
      }
    }

    return this.http.get<InfraestructuraListResponse>(`${this.apiUrl}`, { params })
      .pipe(
        map(response => response.infraestructuras),
        tap(infraestructuras => {
          console.log('📋 Infraestructuras cargadas:', infraestructuras.length);
          this.infraestructurasCache$.next(infraestructuras);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener infraestructura por ID
   */
  getInfraestructuraById(id: string): Observable<Infraestructura> {
    return this.http.get<InfraestructuraResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.infraestructura),
        tap(infraestructura => {
          console.log('🏢 Infraestructura cargada:', infraestructura.razonSocial.principal);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Crear nueva infraestructura
   */
  crearInfraestructura(infraestructura: CrearInfraestructuraRequest): Observable<Infraestructura> {
    console.log('📤 Creando infraestructura:', infraestructura.razonSocial.principal);
    
    return this.http.post<InfraestructuraResponse>(`${this.apiUrl}`, infraestructura)
      .pipe(
        map(response => response.infraestructura),
        tap(nuevaInfraestructura => {
          console.log('✅ Infraestructura creada:', nuevaInfraestructura.id);
          this.invalidarCache();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar infraestructura existente
   */
  actualizarInfraestructura(id: string, datos: ActualizarInfraestructuraRequest): Observable<Infraestructura> {
    console.log('📤 Actualizando infraestructura:', id);
    
    return this.http.put<InfraestructuraResponse>(`${this.apiUrl}/${id}`, datos)
      .pipe(
        map(response => response.infraestructura),
        tap(infraestructuraActualizada => {
          console.log('✅ Infraestructura actualizada:', infraestructuraActualizada.id);
          this.invalidarCache();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar infraestructura
   */
  eliminarInfraestructura(id: string): Observable<boolean> {
    console.log('📤 Eliminando infraestructura:', id);
    
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          console.log('✅ Infraestructura eliminada:', id);
          this.invalidarCache();
        }),
        catchError(this.handleError)
      );
  }

  // ========================================
  // MÉTODOS DE ESTADO
  // ========================================

  /**
   * Cambiar estado de una infraestructura
   */
  cambiarEstado(id: string, cambioEstado: CambiarEstadoInfraestructuraRequest): Observable<Infraestructura> {
    console.log('📤 Cambiando estado de infraestructura:', id, 'a', cambioEstado.estadoNuevo);
    
    return this.http.put<InfraestructuraResponse>(`${this.apiUrl}/${id}/cambiar-estado`, cambioEstado)
      .pipe(
        map(response => response.infraestructura),
        tap(infraestructura => {
          console.log('✅ Estado cambiado exitosamente:', infraestructura.estado);
          this.invalidarCache();
        }),
        catchError(this.handleError)
      );
  }

  // ========================================
  // MÉTODOS DE ESTADÍSTICAS
  // ========================================

  /**
   * Obtener estadísticas generales
   */
  getEstadisticas(): Observable<InfraestructuraEstadisticas> {
    return this.http.get<InfraestructuraEstadisticas>(`${this.apiUrl}/estadisticas`)
      .pipe(
        tap(estadisticas => {
          console.log('📊 Estadísticas de infraestructura cargadas:', estadisticas);
          this.estadisticasCache$.next(estadisticas);
        }),
        catchError(this.handleError)
      );
  }

  // ========================================
  // MÉTODOS DE EXPORTACIÓN
  // ========================================

  /**
   * Exportar infraestructuras a Excel
   */
  exportarExcel(filtros?: FiltrosInfraestructura): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros) {
      // Aplicar filtros para exportación
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params = params.set(key, value.join(','));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get(`${this.apiUrl}/exportar/excel`, {
      params,
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('✅ Exportación Excel completada');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Exportar infraestructuras a PDF
   */
  exportarPDF(filtros?: FiltrosInfraestructura): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params = params.set(key, value.join(','));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get(`${this.apiUrl}/exportar/pdf`, {
      params,
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('✅ Exportación PDF completada');
      }),
      catchError(this.handleError)
    );
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Invalidar cache
   */
  private invalidarCache(): void {
    // Recargar datos después de cambios
    this.getInfraestructuras().subscribe();
    this.getEstadisticas().subscribe();
  }

  /**
   * Limpiar cache
   */
  limpiarCache(): void {
    this.infraestructurasCache$.next([]);
    this.estadisticasCache$.next(null);
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor. Verifique su conexión a internet.';
      } else if (error.status === 401) {
        errorMessage = 'No tiene permisos para realizar esta acción. Inicie sesión nuevamente.';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos suficientes para realizar esta acción.';
      } else if (error.status === 404) {
        errorMessage = 'El recurso solicitado no fue encontrado.';
      } else if (error.status === 422) {
        errorMessage = error.error?.detail || 'Los datos enviados no son válidos.';
      } else if (error.status >= 500) {
        errorMessage = 'Error interno del servidor. Intente nuevamente más tarde.';
      } else {
        errorMessage = error.error?.detail || error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('❌ Error en InfraestructuraService:', {
      status: error.status,
      message: errorMessage,
      error: error.error
    });
    
    return throwError(() => new Error(errorMessage));
  };
}