import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { 
  ConductorExterno, 
  SolicitudConductores, 
  RespuestaConductores,
  ConfiguracionSistemaConductores,
  EventoSincronizacionConductores,
  EstadoConductor,
  EstadoLicencia
} from '../models/conductor-externo.model';
import { environment } from '../../environments/environment';

/**
 * Servicio preparado para integración futura con sistema externo de conductores
 * Este servicio está diseñado para recibir datos de otro sistema
 */
@Injectable({
  providedIn: 'root'
})
export class ConductorExternoService {
  private http = inject(HttpClient);
  
  // URL del sistema externo (se configurará en el futuro)
  private sistemaExternoUrl = environment.conductoresExternoUrl || '';
  
  // Estado de la conexión con el sistema externo
  private estadoConexion$ = new BehaviorSubject<'DESCONECTADO' | 'CONECTADO' | 'ERROR'>('DESCONECTADO');
  
  // Cache local de conductores
  private conductoresCache: ConductorExterno[] = [];
  private ultimaActualizacion: Date | null = null;

  /**
   * Obtener conductores del sistema externo
   * Por ahora retorna array vacío hasta que se implemente la integración
   */
  obtenerConductores(solicitud?: SolicitudConductores): Observable<RespuestaConductores> {
    console.log('🔄 [CONDUCTOR-EXTERNO] Solicitud de conductores:', solicitud);
    
    // TODO: Implementar llamada al sistema externo
    // return this.http.post<RespuestaConductores>(`${this.sistemaExternoUrl}/conductores`, solicitud);
    
    // Por ahora, retornar respuesta vacía
    const respuestaVacia: RespuestaConductores = {
      conductores: [],
      total: 0,
      pagina: 1,
      totalPaginas: 0,
      ultimaActualizacion: new Date().toISOString(),
      sistemaOrigen: {
        nombre: 'Sistema Conductores Externo',
        version: '1.0.0',
        estado: 'OFFLINE'
      }
    };
    
    console.log('ℹ️ [CONDUCTOR-EXTERNO] Sistema externo no configurado, retornando datos vacíos');
    return of(respuestaVacia);
  }

  /**
   * Obtener conductor específico por DNI
   */
  obtenerConductorPorDni(dni: string): Observable<ConductorExterno | null> {
    console.log('🔍 [CONDUCTOR-EXTERNO] Buscando conductor por DNI:', dni);
    
    // TODO: Implementar búsqueda en sistema externo
    // return this.http.get<ConductorExterno>(`${this.sistemaExternoUrl}/conductores/dni/${dni}`);
    
    console.log('ℹ️ [CONDUCTOR-EXTERNO] Sistema externo no configurado');
    return of(null);
  }

  /**
   * Sincronizar conductores con el sistema externo
   */
  sincronizarConductores(forzarCompleta: boolean = false): Observable<EventoSincronizacionConductores> {
    console.log('🔄 [CONDUCTOR-EXTERNO] Iniciando sincronización:', { forzarCompleta });
    
    const inicioSincronizacion = Date.now();
    
    // TODO: Implementar sincronización real
    const eventoSimulado: EventoSincronizacionConductores = {
      id: `sync_${Date.now()}`,
      tipo: 'SINCRONIZACION_COMPLETA',
      fecha: new Date().toISOString(),
      resultado: {
        conductoresActualizados: 0,
        conductoresNuevos: 0,
        errores: ['Sistema externo no configurado']
      },
      duracion: Date.now() - inicioSincronizacion
    };
    
    console.log('ℹ️ [CONDUCTOR-EXTERNO] Sincronización simulada completada');
    return of(eventoSimulado);
  }

  /**
   * Verificar estado de conexión con el sistema externo
   */
  verificarConexion(): Observable<boolean> {
    console.log('🔍 [CONDUCTOR-EXTERNO] Verificando conexión con sistema externo');
    
    if (!this.sistemaExternoUrl) {
      console.log('⚠️ [CONDUCTOR-EXTERNO] URL del sistema externo no configurada');
      this.estadoConexion$.next('DESCONECTADO');
      return of(false);
    }
    
    // TODO: Implementar ping al sistema externo
    // return this.http.get(`${this.sistemaExternoUrl}/health`).pipe(
    //   map(() => {
    //     this.estadoConexion$.next('CONECTADO');
    //     return true;
    //   }),
    //   catchError(() => {
    //     this.estadoConexion$.next('ERROR');
    //     return of(false);
    //   })
    // );
    
    this.estadoConexion$.next('DESCONECTADO');
    return of(false);
  }

  /**
   * Obtener estado actual de la conexión
   */
  getEstadoConexion(): Observable<'DESCONECTADO' | 'CONECTADO' | 'ERROR'> {
    return this.estadoConexion$.asObservable();
  }

  /**
   * Configurar parámetros del sistema externo
   */
  configurarSistemaExterno(config: ConfiguracionSistemaConductores): void {
    console.log('⚙️ [CONDUCTOR-EXTERNO] Configurando sistema externo:', config);
    
    this.sistemaExternoUrl = config.url;
    
    // TODO: Guardar configuración en localStorage o servicio de configuración
    localStorage.setItem('conductor-externo-config', JSON.stringify(config));
    
    // Verificar conexión después de configurar
    this.verificarConexion().subscribe();
  }

  /**
   * Obtener configuración actual
   */
  obtenerConfiguracion(): ConfiguracionSistemaConductores | null {
    const configGuardada = localStorage.getItem('conductor-externo-config');
    return configGuardada ? JSON.parse(configGuardada) : null;
  }

  /**
   * Obtener conductores desde cache local
   */
  obtenerConductoresCache(): ConductorExterno[] {
    return [...this.conductoresCache];
  }

  /**
   * Limpiar cache local
   */
  limpiarCache(): void {
    console.log('🗑️ [CONDUCTOR-EXTERNO] Limpiando cache local');
    this.conductoresCache = [];
    this.ultimaActualizacion = null;
  }

  /**
   * Obtener estadísticas de conductores para el dashboard
   */
  obtenerEstadisticasDashboard(): Observable<{
    total: number;
    activos: number;
    licenciasVigentes: number;
    licenciasVencidas: number;
    ultimaActualizacion: string | null;
  }> {
    const estadisticas = {
      total: this.conductoresCache.length,
      activos: this.conductoresCache.filter(c => c.estado === EstadoConductor.ACTIVO).length,
      licenciasVigentes: this.conductoresCache.filter(c => c.licencia.estado === EstadoLicencia.VIGENTE).length,
      licenciasVencidas: this.conductoresCache.filter(c => c.licencia.estado === EstadoLicencia.VENCIDA).length,
      ultimaActualizacion: this.ultimaActualizacion?.toISOString() || null
    };
    
    console.log('📊 [CONDUCTOR-EXTERNO] Estadísticas calculadas:', estadisticas);
    return of(estadisticas);
  }

  /**
   * Método para testing - simular datos de conductores
   */
  simularDatosConductores(cantidad: number = 5): ConductorExterno[] {
    const conductoresSimulados: ConductorExterno[] = [];
    
    for (let i = 1; i <= cantidad; i++) {
      conductoresSimulados.push({
        id: `conductor_ext_${i}`,
        dni: `1234567${i.toString().padStart(2, '0')}`,
        nombres: `Conductor ${i}`,
        apellidos: `Apellido ${i}`,
        fechaNacimiento: '1980-01-01',
        telefono: `98765432${i}`,
        email: `conductor${i}@email.com`,
        licencia: {
          numero: `LIC${i.toString().padStart(6, '0')}`,
          categoria: 'A-IIb',
          fechaEmision: '2023-01-01',
          fechaVencimiento: '2028-01-01',
          estado: EstadoLicencia.VIGENTE
        },
        estado: EstadoConductor.ACTIVO,
        fechaRegistro: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        sistemaOrigen: {
          id: 'sistema_ext_conductores',
          nombre: 'Sistema Externo Conductores',
          version: '1.0.0',
          ultimaSincronizacion: new Date().toISOString()
        }
      });
    }
    
    return conductoresSimulados;
  }
}