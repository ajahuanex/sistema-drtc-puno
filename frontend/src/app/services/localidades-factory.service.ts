import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LocalidadService } from './localidad.service';
import { LocalidadesLocalService } from './localidades-local.service';
import { LOCALIDADES_CONFIG } from '../config/localidades.config';
import { Localidad, LocalidadCreate, LocalidadUpdate, TipoLocalidad } from '../models/localidad.model';

/**
 * Factory service que decide qué implementación usar según la configuración
 */
@Injectable({
  providedIn: 'root'
})
export class LocalidadesFactoryService {
  private localidadService = inject(LocalidadService);
  private localidadesLocalService = inject(LocalidadesLocalService);
  
  private get servicioActivo() {
    return LOCALIDADES_CONFIG.modo === 'local' 
      ? this.localidadesLocalService 
      : this.localidadService;
  }

  /**
   * Obtener todas las localidades
   */
  obtenerLocalidades(): Promise<Localidad[]> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.obtenerLocalidadesSync();
    } else {
      return this.localidadService.obtenerLocalidades();
    }
  }

  /**
   * Obtener localidades como Observable
   */
  obtenerLocalidadesObservable(): Observable<Localidad[]> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.obtenerLocalidades();
    } else {
      // Convertir Promise a Observable para el servicio remoto
      return new Observable(observer => {
        this.localidadService.obtenerLocalidades()
          .then(localidades => {
            observer.next(localidades);
            observer.complete();
          })
          .catch(error => observer.error(error));
      });
    }
  }

  /**
   * Obtener localidad por ID
   */
  obtenerLocalidadPorId(id: string): Observable<Localidad | null> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.obtenerLocalidadPorId(id);
    } else {
      return new Observable(observer => {
        this.localidadService.obtenerLocalidadPorId(id)
          .then(localidad => {
            observer.next(localidad);
            observer.complete();
          })
          .catch(error => observer.error(error));
      });
    }
  }

  /**
   * Crear nueva localidad
   */
  crearLocalidad(datos: LocalidadCreate): Promise<Localidad> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.crearLocalidad(datos).toPromise() as Promise<Localidad>;
    } else {
      return this.localidadService.crearLocalidad(datos);
    }
  }

  /**
   * Actualizar localidad
   */
  actualizarLocalidad(id: string, datos: LocalidadUpdate): Promise<Localidad> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.actualizarLocalidad(id, datos).toPromise() as Promise<Localidad>;
    } else {
      return this.localidadService.actualizarLocalidad(id, datos);
    }
  }

  /**
   * Eliminar localidad
   */
  eliminarLocalidad(id: string): Promise<void> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.eliminarLocalidad(id).toPromise() as Promise<void>;
    } else {
      return this.localidadService.eliminarLocalidad(id);
    }
  }

  /**
   * Cambiar estado de localidad
   */
  cambiarEstadoLocalidad(id: string, activa: boolean): Promise<Localidad> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.cambiarEstadoLocalidad(id, activa).toPromise() as Promise<Localidad>;
    } else {
      // Implementar en el servicio remoto si es necesario
      return this.actualizarLocalidad(id, { estaActiva: activa });
    }
  }

  /**
   * Toggle estado de localidad (método de compatibilidad)
   */
  async toggleEstadoLocalidad(id: string): Promise<void> {
    // Obtener localidad actual
    const localidad = await this.obtenerLocalidadPorId(id).toPromise();
    if (localidad) {
      await this.cambiarEstadoLocalidad(id, !localidad.estaActiva);
    }
  }

  /**
   * Buscar localidades
   */
  buscarLocalidades(termino: string): Observable<Localidad[]> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.buscarLocalidades(termino);
    } else {
      // Para el servicio remoto, implementar búsqueda local sobre los datos cargados
      return new Observable(observer => {
        this.obtenerLocalidades()
          .then(localidades => {
            const terminoLower = termino.toLowerCase().trim();
            
            if (!terminoLower) {
              observer.next(localidades);
              observer.complete();
              return;
            }

            const resultados = localidades.filter(localidad => {
              const nombre = (localidad.nombre || '').toLowerCase();
              const ubigeo = (localidad.ubigeo || '').toLowerCase();
              const departamento = (localidad.departamento || '').toLowerCase();
              const provincia = (localidad.provincia || '').toLowerCase();
              const distrito = (localidad.distrito || '').toLowerCase();
              const tipo = (localidad.tipo || '').toLowerCase();

              return nombre.includes(terminoLower) ||
                     ubigeo.includes(terminoLower) ||
                     departamento.includes(terminoLower) ||
                     provincia.includes(terminoLower) ||
                     distrito.includes(terminoLower) ||
                     tipo.includes(terminoLower);
            });

            observer.next(resultados);
            observer.complete();
          })
          .catch(error => observer.error(error));
      });
    }
  }

  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas(): Observable<{
    total: number;
    provincias: number;
    distritos: number;
    centrosPoblados: number;
    activas: number;
    inactivas: number;
  }> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      return this.localidadesLocalService.obtenerEstadisticas();
    } else {
      return new Observable(observer => {
        this.obtenerLocalidades()
          .then(localidades => {
            const provincias = localidades.filter(l => l.tipo === 'PROVINCIA').length;
            const distritos = localidades.filter(l => l.tipo === 'DISTRITO').length;
            const centrosPoblados = localidades.filter(l => l.tipo === 'CENTRO_POBLADO').length;
            const activas = localidades.filter(l => l.estaActiva).length;
            const inactivas = localidades.filter(l => !l.estaActiva).length;

            observer.next({
              total: localidades.length,
              provincias,
              distritos,
              centrosPoblados,
              activas,
              inactivas
            });
            observer.complete();
          })
          .catch(error => observer.error(error));
      });
    }
  }

  /**
   * Obtener modo actual de operación
   */
  getModoOperacion(): 'local' | 'remote' {
    return LOCALIDADES_CONFIG.modo;
  }

  /**
   * Cambiar modo de operación (solo para desarrollo/testing)
   */
  cambiarModo(modo: 'local' | 'remote'): void {
    (LOCALIDADES_CONFIG as any).modo = modo;
    console.log(`🔄 Modo de localidades cambiado a: ${modo}`);
  }

  /**
   * Verificar si una localidad está en uso en rutas
   */
  verificarUsoLocalidad(id: string): Promise<{
    en_uso: boolean;
    rutas_como_origen: number;
    rutas_como_destino: number;
    rutas_en_itinerario: number;
    rutas_afectadas: any[];
  }> {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      // En modo local, simular que no está en uso
      return Promise.resolve({
        en_uso: false,
        rutas_como_origen: 0,
        rutas_como_destino: 0,
        rutas_en_itinerario: 0,
        rutas_afectadas: []
      });
    } else {
      return this.localidadService.verificarUsoLocalidad(id);
    }
  }

  /**
   * Obtener información del servicio activo
   */
  getInfoServicio(): { modo: string; descripcion: string } {
    if (LOCALIDADES_CONFIG.modo === 'local') {
      const metadata = this.localidadesLocalService.obtenerMetadata();
      return {
        modo: 'Local',
        descripcion: metadata ? 
          `${metadata.descripcion} (v${metadata.version})` : 
          'Base de datos local'
      };
    } else {
      return {
        modo: 'Remoto',
        descripcion: 'API del servidor'
      };
    }
  }
}