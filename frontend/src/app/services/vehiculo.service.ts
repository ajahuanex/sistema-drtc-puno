import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, tap } from 'rxjs';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { AuthService } from './auth.service';
import { DataManagerClientService } from './data-manager-client.service';
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
  
  private apiUrl = environment.apiUrl;

  // Datos mock básicos para fallback
  private mockVehiculos: Vehiculo[] = [
    {
      id: '1',
      placa: 'PUN-001',
      empresaActualId: '1',
      resolucionId: '1',
      marca: 'MERCEDES BENZ',
      modelo: 'OH-1628',
      anioFabricacion: 2020,
      estado: 'ACTIVO',
      estaActivo: true,
      rutasAsignadasIds: ['1'],
      categoria: 'M3',
      datosTecnicos: {
        motor: 'OM906LA001',
        chasis: '8JMOH1628LA001',
        cilindros: 6,
        ejes: 2,
        ruedas: 6,
        asientos: 45,
        pesoNeto: 8500,
        pesoBruto: 16000,
        medidas: {
          largo: 12000,
          ancho: 2500,
          alto: 3200
        }
      }
    }
  ];

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
    if (environment.useDataManager) {
      return this.getVehiculosPersistentes();
    } else {
      return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, {
        headers: this.getHeaders()
      }).pipe(
        catchError(error => {
          console.error('Error obteniendo vehículos:', error);
          return of(this.mockVehiculos);
        })
      );
    }
  }

  getVehiculo(id: string): Observable<Vehiculo | null> {
    if (environment.useDataManager) {
      return this.getVehiculoCompleto(id);
    } else {
      return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, {
        headers: this.getHeaders()
      }).pipe(
        catchError(error => {
          console.error('Error obteniendo vehículo:', error);
          const vehiculo = this.mockVehiculos.find(v => v.id === id);
          return of(vehiculo || null);
        })
      );
    }
  }

  createVehiculo(vehiculo: VehiculoCreate): Observable<Vehiculo> {
    if (environment.useDataManager) {
      return this.createVehiculoPersistente(vehiculo);
    } else {
      return this.http.post<Vehiculo>(`${this.apiUrl}/vehiculos`, vehiculo, {
        headers: this.getHeaders()
      }).pipe(
        catchError(error => {
          console.error('Error creando vehículo:', error);
          return throwError(() => error);
        })
      );
    }
  }

  updateVehiculo(id: string, vehiculo: VehiculoUpdate): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculo, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error actualizando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  deleteVehiculo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error eliminando vehículo:', error);
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
          return of(this.mockVehiculos);
        })
      );
    } else {
      return of(this.mockVehiculos);
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
      // Fallback a mock
      const nuevoVehiculo: Vehiculo = {
        ...vehiculoData,
        id: (this.mockVehiculos.length + 1).toString(),
        estado: 'ACTIVO',
        estaActivo: true
      };
      
      this.mockVehiculos.push(nuevoVehiculo);
      return of(nuevoVehiculo);
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
      const vehiculo = this.mockVehiculos.find(v => v.id === vehiculoId);
      return of(vehiculo || null);
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
      const vehiculo = this.mockVehiculos.find(v => v.id === vehiculoId);
      return of(vehiculo || null);
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
      const vehiculos = this.mockVehiculos.filter(v => v.empresaActualId === empresaId);
      return of(vehiculos);
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
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/placa/${placa}`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of(null)));
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
      // Verificar en mock
      const placaUpper = placa.toUpperCase().trim();
      const vehiculoExistente = this.mockVehiculos.find(v => 
        v.placa.toUpperCase() === placaUpper && v.id !== vehiculoIdActual
      );
      return of(!vehiculoExistente);
    }
  }
}
