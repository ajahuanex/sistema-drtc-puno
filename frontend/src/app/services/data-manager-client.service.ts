import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces para el DataManager
export interface DataManagerStats {
  estadisticas_generales: {
    total_empresas: number;
    total_vehiculos: number;
    total_conductores: number;
    total_rutas: number;
    total_expedientes: number;
    total_resoluciones: number;
    total_validaciones: number;
  };
  estadisticas_por_estado: {
    vehiculos: Record<string, number>;
    conductores: Record<string, number>;
    expedientes: Record<string, number>;
  };
  relaciones_activas: {
    vehiculos_con_conductor: number;
    vehiculos_sin_conductor: number;
    conductores_con_vehiculo: number;
    conductores_sin_vehiculo: number;
  };
  informacion_sesion: {
    inicio_sesion: string;
    ultima_actualizacion: string;
    tiempo_activo: string;
  };
  log_operaciones_recientes: Array<{
    timestamp: string;
    tipo: string;
    descripcion: string;
  }>;
}

export interface DataManagerResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataManagerClientService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl || 'http://localhost:8000/api/v1'}/data-manager`;
  
  // Subjects para mantener estado reactivo
  private statsSubject = new BehaviorSubject<DataManagerStats | null>(null);
  public stats$ = this.statsSubject.asObservable();
  
  private lastUpdateSubject = new BehaviorSubject<string>('');
  public lastUpdate$ = this.lastUpdateSubject.asObservable();

  constructor() {
    // Cargar estadísticas iniciales
    this.loadStats();
    
    // Actualizar estadísticas cada 30 segundos
    setInterval(() => {
      this.loadStats();
    }, 30000);
  }

  // ===== ESTADÍSTICAS Y ESTADO =====
  
  getStats(): Observable<DataManagerResponse<DataManagerStats>> {
    return this.http.get<DataManagerResponse<DataManagerStats>>(`${this.baseUrl}/estadisticas`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.statsSubject.next(response.data);
            this.lastUpdateSubject.next(new Date().toISOString());
          }
        })
      );
  }

  getDashboard(): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/dashboard`);
  }

  getRelations(): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/relaciones`);
  }

  getHealthCheck(): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/health`);
  }

  // ===== CONSULTAS POR MÓDULO =====
  
  getModuleData(module: string): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/datos/${module}`);
  }

  searchByModule(module: string, criteria: any = {}): Observable<DataManagerResponse<any>> {
    const params = new URLSearchParams(criteria).toString();
    const url = `${this.baseUrl}/buscar/${module}${params ? '?' + params : ''}`;
    return this.http.get<DataManagerResponse<any>>(url);
  }

  // ===== EMPRESAS =====
  
  getCompanyComplete(companyId: string): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/empresa/${companyId}/completa`);
  }

  addCompany(companyData: any): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/agregar/empresas`, companyData)
      .pipe(tap(() => this.loadStats()));
  }

  // ===== VEHÍCULOS =====
  
  getVehicleComplete(vehicleId: string): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/vehiculo/${vehicleId}/completo`);
  }

  getVehicleFullFlow(vehicleId: string): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/vehiculo/${vehicleId}/flujo-completo`);
  }

  addVehicle(vehicleData: any): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/agregar/vehiculos`, vehicleData)
      .pipe(tap(() => this.loadStats()));
  }

  // ===== CONDUCTORES =====
  
  addDriver(driverData: any): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/agregar/conductores`, driverData)
      .pipe(tap(() => this.loadStats()));
  }

  // ===== RUTAS =====
  
  addRoute(routeData: any): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/agregar/rutas`, routeData)
      .pipe(tap(() => this.loadStats()));
  }

  // ===== EXPEDIENTES =====
  
  addExpedient(expedientData: any): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/agregar/expedientes`, expedientData)
      .pipe(tap(() => this.loadStats()));
  }

  // ===== RESOLUCIONES =====
  
  addResolution(resolutionData: any): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/agregar/resoluciones`, resolutionData)
      .pipe(tap(() => this.loadStats()));
  }

  // ===== VALIDACIONES =====
  
  getVehicleValidationHistory(vehicleId: string): Observable<DataManagerResponse<any>> {
    return this.http.get<DataManagerResponse<any>>(`${this.baseUrl}/historial-validaciones/${vehicleId}`);
  }

  addValidationToHistory(vehicleId: string, validationData: any): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/validacion/${vehicleId}`, validationData)
      .pipe(tap(() => this.loadStats()));
  }

  // ===== UTILIDADES =====
  
  resetSystem(): Observable<DataManagerResponse<any>> {
    return this.http.post<DataManagerResponse<any>>(`${this.baseUrl}/reset`, {})
      .pipe(tap(() => this.loadStats()));
  }

  // ===== MÉTODOS PRIVADOS =====
  
  private loadStats(): void {
    this.getStats().subscribe({
      next: (response) => {
        console.log('📊 Estadísticas del DataManager actualizadas:', response.data);
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas del DataManager:', error);
      }
    });
  }

  // ===== MÉTODOS DE CONVENIENCIA =====
  
  // Obtener todos los vehículos
  getAllVehicles(): Observable<any[]> {
    return this.getModuleData('vehiculos').pipe(
      map(response => response.success ? Object.values(response.data.datos) : [])
    );
  }

  // Obtener todas las empresas
  getAllCompanies(): Observable<any[]> {
    return this.getModuleData('empresas').pipe(
      map(response => response.success ? Object.values(response.data.datos) : [])
    );
  }

  // Obtener todos los conductores
  getAllDrivers(): Observable<any[]> {
    return this.getModuleData('conductores').pipe(
      map(response => response.success ? Object.values(response.data.datos) : [])
    );
  }

  // Obtener todas las rutas
  getAllRoutes(): Observable<any[]> {
    return this.getModuleData('rutas').pipe(
      map(response => response.success ? Object.values(response.data.datos) : [])
    );
  }

  // Obtener todos los expedientes
  getAllExpedients(): Observable<any[]> {
    return this.getModuleData('expedientes').pipe(
      map(response => response.success ? Object.values(response.data.datos) : [])
    );
  }

  // Obtener todas las resoluciones
  getAllResolutions(): Observable<any[]> {
    return this.getModuleData('resoluciones').pipe(
      map(response => response.success ? Object.values(response.data.datos) : [])
    );
  }

  // Buscar vehículos por empresa
  getVehiclesByCompany(companyId: string): Observable<any[]> {
    return this.searchByModule('vehiculos', { empresa_id: companyId }).pipe(
      map(response => response.success ? response.data.resultados : [])
    );
  }

  // Buscar conductores activos
  getActiveDrivers(): Observable<any[]> {
    return this.searchByModule('conductores', { estado: 'ACTIVO' }).pipe(
      map(response => response.success ? response.data.resultados : [])
    );
  }

  // Buscar rutas activas
  getActiveRoutes(): Observable<any[]> {
    return this.searchByModule('rutas', { estado: 'ACTIVA' }).pipe(
      map(response => response.success ? response.data.resultados : [])
    );
  }

  // ===== NOTIFICACIONES =====
  
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Aquí podrías integrar con un servicio de notificaciones
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}
