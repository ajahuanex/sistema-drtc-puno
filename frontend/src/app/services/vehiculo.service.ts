import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, tap, switchMap } from 'rxjs';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { AuthService } from './auth.service';
import { DataManagerClientService } from './data-manager-client.service';
import { HistorialVehicularService } from './historial-vehicular.service';
import { TipoEventoHistorial, EstadoVehiculo } from '../models/historial-vehicular.model';
import { environment } from '../../environments/environment';

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

interface EstadisticasCargaMasiva {
  total_cargas: number;
  vehiculos_cargados_total: number;
  ultima_carga: string;
  promedio_exitosos: number;
  errores_comunes: {
    error: string;
    frecuencia: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private dataManager = inject(DataManagerClientService);
  private historialService = inject(HistorialVehicularService);
  
  private apiUrl = environment.apiUrl;



  // Constructor removido - usando inject() en las propiedades

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ========================================
  // MÉTODOS BÁSICOS CRUD
  // ========================================

  getVehiculos(): Observable<Vehiculo[]> {
    // SOLO API REAL - NO DATAMANAGER
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo vehículos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener todos los vehículos incluyendo los eliminados (para administradores)
   */
  getTodosLosVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/todos`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo todos los vehículos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener solo los vehículos eliminados
   */
  getVehiculosEliminados(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, {
      headers: this.getHeaders()
    }).pipe(
      map(vehiculos => vehiculos.filter(vehiculo => vehiculo.estaActivo === false)),
      catchError(error => {
        console.error('Error obteniendo vehículos eliminados:', error);
        return of([]);
      })
    );
  }

  /**
   * Restaurar un vehículo eliminado (cambiar estado de ELIMINADO a ACTIVO)
   */
  restaurarVehiculo(id: string): Observable<void> {
    return this.getVehiculo(id).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        if (vehiculo.estaActivo !== false) {
          return throwError(() => new Error('El vehículo no está eliminado'));
        }

        const vehiculoRestaurado: VehiculoUpdate = {
          estado: 'ACTIVO',
          estaActivo: true
        };

        return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculoRestaurado, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(() => {
            // Registrar restauración en el historial
            return this.historialService.crearRegistroHistorial({
              vehiculoId: id,
              placa: vehiculo.placa,
              tipoEvento: TipoEventoHistorial.MODIFICACION,
              descripcion: `Vehículo ${vehiculo.placa} restaurado del estado eliminado`,
              fechaEvento: new Date().toISOString(),
              estadoAnterior: EstadoVehiculo.DADO_DE_BAJA,
              estadoNuevo: EstadoVehiculo.ACTIVO,
              observaciones: 'Restauración de vehículo previamente eliminado'
            }).pipe(
              map(() => undefined),
              catchError(error => {
                console.error('Error registrando restauración:', error);
                return of(undefined);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error restaurando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  getVehiculo(id: string): Observable<Vehiculo | null> {
    // SOLO API REAL - NO DATAMANAGER
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo vehículo:', error);
        return of(null);
      })
    );
  }

  createVehiculo(vehiculo: VehiculoCreate): Observable<Vehiculo> {
    // SOLO API REAL - NO DATAMANAGER
    console.log('🔍 Creando vehículo en API real:', vehiculo);
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehiculos`, vehiculo, {
      headers: this.getHeaders()
    }).pipe(
      switchMap(vehiculoCreado => {
        // Registrar en el historial vehicular
        return this.historialService.registrarCreacionVehiculo(
          vehiculoCreado.id,
          vehiculoCreado.placa,
          vehiculoCreado
        ).pipe(
          map(() => vehiculoCreado),
          catchError(error => {
            console.error('Error registrando historial de creación:', error);
            // No fallar la creación del vehículo por error en historial
            return of(vehiculoCreado);
          })
        );
      }),
      catchError(error => {
        console.error('Error creando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  updateVehiculo(id: string, vehiculo: VehiculoUpdate): Observable<Vehiculo> {
    // Primero obtener los datos actuales para el historial
    return this.getVehiculo(id).pipe(
      switchMap(vehiculoAnterior => {
        if (!vehiculoAnterior) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculo, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(vehiculoActualizado => {
            // Registrar cambios en el historial
            const promesasHistorial: Observable<any>[] = [];

            // Detectar transferencia de empresa
            if (vehiculo.empresaActualId && vehiculoAnterior.empresaActualId !== vehiculo.empresaActualId) {
              promesasHistorial.push(
                this.historialService.registrarTransferenciaEmpresa(
                  id,
                  vehiculoActualizado.placa,
                  vehiculoAnterior.empresaActualId || '',
                  vehiculo.empresaActualId,
                  'Empresa Anterior', // TODO: Obtener nombres reales
                  'Empresa Nueva'
                ).pipe(catchError(error => {
                  console.error('Error registrando transferencia:', error);
                  return of(null);
                }))
              );
            }

            // Detectar cambio de estado
            if (vehiculo.estado && vehiculoAnterior.estado !== vehiculo.estado) {
              promesasHistorial.push(
                this.historialService.registrarCambioEstado(
                  id,
                  vehiculoActualizado.placa,
                  vehiculoAnterior.estado as EstadoVehiculo,
                  vehiculo.estado as EstadoVehiculo
                ).pipe(catchError(error => {
                  console.error('Error registrando cambio de estado:', error);
                  return of(null);
                }))
              );
            }

            // Registrar modificación general si no hay eventos específicos
            if (promesasHistorial.length === 0) {
              promesasHistorial.push(
                this.historialService.registrarModificacionVehiculo(
                  id,
                  vehiculoActualizado.placa,
                  vehiculoAnterior,
                  vehiculoActualizado
                ).pipe(catchError(error => {
                  console.error('Error registrando modificación:', error);
                  return of(null);
                }))
              );
            }

            // Ejecutar registros de historial en paralelo sin bloquear la respuesta
            promesasHistorial.forEach(promesa => promesa.subscribe());

            return of(vehiculoActualizado);
          })
        );
      }),
      catchError(error => {
        console.error('Error actualizando vehículo:', error);
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

        // Usar DELETE en lugar de PUT para eliminación lógica
        return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(() => {
            // Registrar eliminación lógica en el historial
            return this.historialService.crearRegistroHistorial({
              vehiculoId: id,
              placa: vehiculo.placa,
              tipoEvento: TipoEventoHistorial.BAJA_DEFINITIVA,
              descripcion: `Vehículo ${vehiculo.placa} eliminado del sistema (borrado lógico)`,
              fechaEvento: new Date().toISOString(),
              estadoAnterior: vehiculo.estado as EstadoVehiculo,
              estadoNuevo: EstadoVehiculo.DADO_DE_BAJA,
              observaciones: 'Eliminación lógica del vehículo - El registro se mantiene en la base de datos'
            }).pipe(
              map(() => undefined),
              catchError(error => {
                console.error('Error registrando eliminación lógica:', error);
                return of(undefined);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error eliminando vehículo (borrado lógico):', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // MÉTODOS CON DATAMANAGER PERSISTENTE
  // ========================================

  /**
   * Obtener todos los vehículos desde DataManager persistente
   */
  getVehiculosPersistentes(): Observable<Vehiculo[]> {
    if (environment.useDataManager) {
      console.log('🗄️ Obteniendo vehículos desde DataManager persistente');
      return this.dataManager.getAllVehicles().pipe(
        map(vehicles => vehicles.map(v => this.mapToVehiculo(v))),
        catchError(error => {
          console.error('❌ Error obteniendo vehículos persistentes:', error);
          return of([]);
        })
      );
    } else {
      return of([]);
    }
  }

  /**
   * Crear vehículo en DataManager persistente
   */
  createVehiculoPersistente(vehiculoData: VehiculoCreate): Observable<Vehiculo> {
    if (environment.useDataManager) {
      console.log('🗄️ Creando vehículo en DataManager persistente:', vehiculoData);
      return this.dataManager.addVehicle(vehiculoData).pipe(
        map(response => {
          if (response.success) {
            this.dataManager.showNotification('Vehículo creado exitosamente', 'success');
            return this.mapToVehiculo(response.data);
          } else {
            throw new Error(response.message);
          }
        }),
        catchError(error => {
          console.error('❌ Error creando vehículo persistente:', error);
          this.dataManager.showNotification('Error al crear vehículo', 'error');
          return throwError(() => error);
        })
      );
    } else {
      // Backend no disponible
      return throwError(() => new Error('Error al crear vehículo - Backend no disponible'));
    }
  }

  /**
   * Obtener vehículo completo con todas sus relaciones
   */
  getVehiculoCompleto(vehiculoId: string): Observable<any> {
    if (environment.useDataManager) {
      console.log('🗄️ Obteniendo vehículo completo desde DataManager:', vehiculoId);
      return this.dataManager.getVehicleComplete(vehiculoId).pipe(
        map(response => response.success ? response.data : null),
        catchError(error => {
          console.error('❌ Error obteniendo vehículo completo:', error);
          return of(null);
        })
      );
    } else {
      return of(null);
    }
  }

  /**
   * Obtener flujo completo de un vehículo (empresa → vehículo → expedientes → resoluciones)
   */
  getVehiculoFlujoCompleto(vehiculoId: string): Observable<any> {
    if (environment.useDataManager) {
      console.log('🗄️ Obteniendo flujo completo desde DataManager:', vehiculoId);
      return this.dataManager.getVehicleFullFlow(vehiculoId).pipe(
        map(response => response.success ? response.data : null),
        catchError(error => {
          console.error('❌ Error obteniendo flujo completo:', error);
          return of(null);
        })
      );
    } else {
      return of(null);
    }
  }

  /**
   * Obtener vehículos por empresa desde DataManager
   */
  getVehiculosPorEmpresaPersistente(empresaId: string): Observable<Vehiculo[]> {
    if (environment.useDataManager) {
      console.log('🗄️ Obteniendo vehículos por empresa desde DataManager:', empresaId);
      return this.dataManager.getVehiclesByCompany(empresaId).pipe(
        map(vehicles => vehicles.map(v => this.mapToVehiculo(v))),
        catchError(error => {
          console.error('❌ Error obteniendo vehículos por empresa:', error);
          return of([]);
        })
      );
    } else {
      return of([]);
    }
  }

  /**
   * Obtener estadísticas del DataManager
   */
  getEstadisticasPersistentes(): Observable<any> {
    if (environment.useDataManager) {
      return this.dataManager.stats$;
    } else {
      return of(null);
    }
  }

  /**
   * Resetear datos del sistema (solo para desarrollo)
   */
  resetearSistema(): Observable<any> {
    if (environment.useDataManager && !environment.production) {
      console.log('🔄 Reseteando sistema DataManager');
      return this.dataManager.resetSystem().pipe(
        tap(response => {
          if (response.success) {
            this.dataManager.showNotification('Sistema reseteado exitosamente', 'success');
          }
        })
      );
    } else {
      return of({ success: false, message: 'Reset no disponible en producción' });
    }
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  /**
   * Mapear datos del DataManager a modelo Vehiculo
   */
  private mapToVehiculo(data: any): Vehiculo {
    return {
      id: data.id,
      placa: data.placa,
      sedeRegistro: data.sedeRegistro,
      empresaActualId: data.empresaId || data.empresaActualId,
      resolucionId: data.resolucionId,
      marca: data.marca,
      modelo: data.modelo,
      anioFabricacion: data.anioFabricacion || data.año,
      estado: data.estado || 'ACTIVO',
      estaActivo: data.estaActivo !== false,
      rutasAsignadasIds: data.rutasAsignadasIds || [],
      categoria: data.categoria || 'M3',
      tuc: data.tuc,
      datosTecnicos: data.datosTecnicos || {
        motor: data.numeroMotor || data.motor || 'N/A',
        chasis: data.numeroChasis || data.chasis || 'N/A',
        cilindros: data.cilindros || 6,
        ejes: data.numeroEjes || data.ejes || 2,
        ruedas: data.ruedas || 6,
        asientos: data.numeroAsientos || data.asientos || 45,
        pesoNeto: data.pesoSeco || data.pesoNeto || 8500,
        pesoBruto: data.pesoBruto || 16000,
        tipoCombustible: data.tipoCombustible || 'DIESEL',
        medidas: data.medidas || {
          largo: 12000,
          ancho: 2500,
          alto: 3200
        }
      },
      numeroHistorialValidacion: data.numeroHistorialValidacion,
      esHistorialActual: data.esHistorialActual,
      vehiculoHistorialActualId: data.vehiculoHistorialActualId
    };
  }

  /**
   * Verificar si el DataManager está disponible
   */
  isDataManagerAvailable(): boolean {
    return environment.useDataManager && !environment.production;
  }

  /**
   * Obtener información del estado del DataManager
   */
  getDataManagerStatus(): Observable<any> {
    if (environment.useDataManager) {
      return this.dataManager.getHealthCheck();
    } else {
      return of({ success: false, message: 'DataManager no habilitado' });
    }
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA (SIMPLIFICADOS)
  // ========================================

  validarArchivoExcel(archivo: File): Observable<VehiculoValidacion[]> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<any>(`${this.apiUrl}/vehiculos/validar-excel`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    }).pipe(
      map(response => response.validaciones || []),
      catchError(error => {
        console.error('Error validando archivo:', error);
        return of([]);
      })
    );
  }

  procesarCargaMasiva(archivo: File, empresaId: string): Observable<CargaMasivaResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('empresa_id', empresaId);

    return this.http.post<CargaMasivaResponse>(`${this.apiUrl}/vehiculos/carga-masiva`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    }).pipe(
      catchError(error => {
        console.error('Error en carga masiva:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEstadisticasCargaMasiva(): Observable<EstadisticasCargaMasiva> {
    return this.http.get<EstadisticasCargaMasiva>(`${this.apiUrl}/vehiculos/estadisticas-carga-masiva`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return of({
          total_cargas: 0,
          vehiculos_cargados_total: 0,
          ultima_carga: '',
          promedio_exitosos: 0,
          errores_comunes: []
        });
      })
    );
  }

  /**
   * Marca vehículos como historial actual
   */
  async marcarVehiculosHistorialActual(): Promise<any> {
    try {
      const response = await this.http.post(`${this.apiUrl}/vehiculos/marcar-historial-actual`, {}, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error marcando vehículos como historial actual:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas filtradas
   */
  async obtenerEstadisticasFiltrado(): Promise<any> {
    try {
      const response = await this.http.get(`${this.apiUrl}/vehiculos/estadisticas-filtrado`, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error obteniendo estadísticas filtradas:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial detallado de un vehículo
   */
  async obtenerHistorialDetallado(vehiculoId: string): Promise<any> {
    try {
      const response = await this.http.get(`${this.apiUrl}/vehiculos/${vehiculoId}/historial-detallado`, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error obteniendo historial detallado:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de historial
   */
  async obtenerEstadisticasHistorial(): Promise<any> {
    try {
      const response = await this.http.get(`${this.apiUrl}/vehiculos/estadisticas-historial`, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error obteniendo estadísticas de historial:', error);
      throw error;
    }
  }

  /**
   * Actualiza historial de todos los vehículos
   */
  async actualizarHistorialTodos(): Promise<any> {
    try {
      const response = await this.http.post(`${this.apiUrl}/vehiculos/actualizar-historial-todos`, {}, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error actualizando historial de todos:', error);
      throw error;
    }
  }

  getVehiculoById(id: string): Observable<Vehiculo | null> {
    return this.getVehiculo(id);
  }

  getVehiculoByPlaca(placa: string): Observable<Vehiculo | null> {
    return this.http.get<any>(`${this.apiUrl}/vehiculos/validar-placa/${placa}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.vehiculo || null),
      catchError(() => of(null))
    );
  }

  getVehiculosPorResolucion(resolucionId: string): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/resolucion/${resolucionId}`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  async obtenerVehiculosVisibles(): Promise<Vehiculo[]> {
    try {
      const response = await this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/visibles`, {
        headers: this.getHeaders()
      }).toPromise();
      return response || [];
    } catch (error: any) {
      console.error('Error obteniendo vehículos visibles:', error);
      return [];
    }
  }

  descargarPlantillaExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/vehiculos/plantilla-excel`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  validarExcel(archivo: File): Observable<any[]> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<any[]>(`${this.apiUrl}/vehiculos/validar-excel`, formData, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })
    }).pipe(catchError(() => of([])));
  }

  cargaMasivaVehiculos(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/vehiculos/carga-masiva-vehiculos`, formData, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })
    });
  }

  // ========================================
  // MÉTODOS DE RUTAS ESPECÍFICAS
  // ========================================

  /**
   * Obtener rutas específicas de un vehículo
   */
  getRutasEspecificasVehiculo(vehiculoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehiculos/${vehiculoId}/rutas-especificas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo rutas específicas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener rutas generales disponibles para un vehículo
   */
  getRutasGeneralesDisponibles(vehiculoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehiculos/${vehiculoId}/rutas-generales-disponibles`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo rutas generales disponibles:', error);
        return of([]);
      })
    );
  }

  /**
   * Crear una ruta específica para un vehículo
   */
  crearRutaEspecifica(vehiculoId: string, rutaEspecificaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/vehiculos/${vehiculoId}/rutas-especificas`, rutaEspecificaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creando ruta específica:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar una ruta específica
   */
  actualizarRutaEspecifica(rutaEspecificaId: string, rutaEspecificaData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rutas-especificas/${rutaEspecificaId}`, rutaEspecificaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error actualizando ruta específica:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar una ruta específica
   */
  eliminarRutaEspecifica(rutaEspecificaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rutas-especificas/${rutaEspecificaId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error eliminando ruta específica:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener detalle de una ruta específica
   */
  getRutaEspecifica(rutaEspecificaId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rutas-especificas/${rutaEspecificaId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo ruta específica:', error);
        return of(null);
      })
    );
  }

  /**
   * Validar datos de ruta específica antes de crear/actualizar
   */
  validarRutaEspecifica(rutaEspecificaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rutas-especificas/validar`, rutaEspecificaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error validando ruta específica:', error);
        return of({ valida: false, errores: ['Error de validación'] });
      })
    );
  }

  /**
   * Obtener plantilla de ruta específica basada en ruta general
   */
  getPlantillaRutaEspecifica(rutaGeneralId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rutas-generales/${rutaGeneralId}/plantilla`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo plantilla de ruta específica:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtener estadísticas de rutas específicas de un vehículo
   */
  getEstadisticasRutasEspecificas(vehiculoId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehiculos/${vehiculoId}/estadisticas-rutas-especificas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas de rutas específicas:', error);
        return of({
          totalRutasEspecificas: 0,
          rutasActivas: 0,
          rutasInactivas: 0,
          horariosDefinidos: 0,
          paradasAdicionales: 0
        });
      })
    );
  }

  // ========================================
  // MÉTODOS DE VALIDACIÓN
  // ========================================

  /**
   * Verificar si una placa está disponible (no duplicada)
   * @param placa - Placa a verificar
   * @param vehiculoIdActual - ID del vehículo actual (para edición)
   * @returns Observable<boolean> - true si está disponible, false si está duplicada
   */
  verificarPlacaDisponible(placa: string, vehiculoIdActual?: string): Observable<boolean> {
    if (environment.useDataManager) {
      // Verificar en DataManager
      return this.getVehiculosPersistentes().pipe(
        map(vehiculos => {
          const placaUpper = placa.toUpperCase().trim();
          const vehiculoExistente = vehiculos.find(v => 
            v.placa.toUpperCase() === placaUpper && v.id !== vehiculoIdActual
          );
          return !vehiculoExistente; // true si no existe (disponible)
        }),
        catchError(() => of(true)) // En caso de error, permitir continuar
      );
    } else {
      // Backend no disponible - asumir placa disponible
      return of(true);
    }
  }

  /**
   * Cambiar el estado de un vehículo y registrar en el historial
   */
  cambiarEstadoVehiculo(
    vehiculoId: string, 
    nuevoEstado: string, 
    motivo?: string, 
    observaciones?: string
  ): Observable<Vehiculo> {
    return this.getVehiculo(vehiculoId).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        const estadoAnterior = vehiculo.estado;
        
        // Actualizar el vehículo - versión simplificada para debugging
        const updateData: any = {
          estado: nuevoEstado
        };

        // Solo agregar campos de baja si realmente es necesario
        if (nuevoEstado !== 'ACTIVO') {
          updateData.fechaBaja = new Date().toISOString();
          if (motivo) {
            updateData.motivoBaja = motivo;
          }
          if (observaciones) {
            updateData.observacionesBaja = observaciones;
          }
        }

        console.log('🔄 Actualizando estado del vehículo:', {
          vehiculoId,
          estadoAnterior,
          estadoNuevo: nuevoEstado
        });

        return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${vehiculoId}`, updateData, {
          headers: this.getHeaders()
        }).pipe(
          tap(vehiculoActualizado => {
            // Registrar en el historial vehicular general
            this.historialService.crearRegistroHistorial({
              vehiculoId: vehiculoId,
              placa: vehiculo.placa,
              tipoEvento: TipoEventoHistorial.CAMBIO_ESTADO,
              descripcion: `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}`,
              estadoAnterior: estadoAnterior as EstadoVehiculo,
              estadoNuevo: nuevoEstado as EstadoVehiculo,
              observaciones: `Motivo: ${motivo}. ${observaciones || ''}`
            }).subscribe({
              next: () => console.log('✅ Evento de cambio de estado registrado en historial vehicular'),
              error: (error: any) => console.error('❌ Error registrando evento en historial vehicular:', error)
            });
          })
        );
      }),
      catchError(error => {
        console.error('Error cambiando estado del vehículo:', error);
        return throwError(() => error);
      })
    );
  }
}
