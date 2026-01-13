import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Localidad, LocalidadCreate } from '../models/localidad.model';

export interface LocalidadRuta {
  nombre: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  tipo: 'ORIGEN' | 'DESTINO' | 'ITINERARIO';
}

export interface LocalidadProcesada {
  id: string;
  nombre: string;
  esNueva: boolean;
  tipo: 'ORIGEN' | 'DESTINO' | 'ITINERARIO';
}

@Injectable({
  providedIn: 'root'
})
export class LocalidadManagerService {
  private apiUrl = environment.apiUrl;
  private localidadesCache = new BehaviorSubject<Localidad[]>([]);
  private cacheActualizado = false;
  private actualizandoCache = false; // Flag para evitar múltiples actualizaciones simultáneas

  constructor(private http: HttpClient) {}

  /**
   * Procesa las localidades de una ruta asegurando unicidad
   */
  async procesarLocalidadesRuta(localidades: LocalidadRuta[]): Promise<LocalidadProcesada[]> {
    try {
      console.log('🔄 Procesando localidades de ruta:', localidades);
      
      // Asegurar que el cache esté actualizado
      await this.actualizarCache();
      
      const resultados: LocalidadProcesada[] = [];
      
      for (const localidadRuta of localidades) {
        const resultado = await this.procesarLocalidadIndividual(localidadRuta);
        resultados.push(resultado);
      }
      
      console.log('✅ Localidades procesadas:', resultados);
      return resultados;
      
    } catch (error) {
      console.error('❌ Error procesando localidades de ruta:', error);
      throw error;
    }
  }

  /**
   * Procesa una localidad individual
   */
  private async procesarLocalidadIndividual(localidadRuta: LocalidadRuta): Promise<LocalidadProcesada> {
    const localidadesExistentes = this.localidadesCache.value;
    
    // Buscar si ya existe una localidad con el mismo nombre (case-insensitive)
    const localidadExistente = localidadesExistentes.find(loc => 
      this.normalizarNombre(loc.nombre || '') === this.normalizarNombre(localidadRuta.nombre)
    );
    
    if (localidadExistente) {
      // Reutilizar localidad existente
      console.log(`♻️ Reutilizando localidad existente: ${localidadRuta.nombre} -> ${localidadExistente.id}`);
      
      return {
        id: localidadExistente.id,
        nombre: localidadExistente.nombre || localidadRuta.nombre,
        esNueva: false,
        tipo: localidadRuta.tipo
      };
    } else {
      // Crear nueva localidad
      console.log(`🆕 Creando nueva localidad: ${localidadRuta.nombre}`);
      
      const nuevaLocalidad = await this.crearNuevaLocalidad(localidadRuta);
      
      // Actualizar cache
      const localidadesActualizadas = [...this.localidadesCache.value, nuevaLocalidad];
      this.localidadesCache.next(localidadesActualizadas);
      
      return {
        id: nuevaLocalidad.id,
        nombre: nuevaLocalidad.nombre || localidadRuta.nombre,
        esNueva: true,
        tipo: localidadRuta.tipo
      };
    }
  }

  /**
   * Crea una nueva localidad
   */
  private async crearNuevaLocalidad(localidadRuta: LocalidadRuta): Promise<Localidad> {
    const nuevaLocalidad: LocalidadCreate = {
      nombre: localidadRuta.nombre,
      departamento: localidadRuta.departamento || 'NO_ESPECIFICADO',
      provincia: localidadRuta.provincia || 'NO_ESPECIFICADO',
      distrito: localidadRuta.distrito || 'NO_ESPECIFICADO',
      municipalidad_centro_poblado: localidadRuta.nombre,
      nivel_territorial: this.determinarNivelTerritorial(localidadRuta),
      tipo: this.determinarTipoLocalidad(localidadRuta.nombre),
      descripcion: `Localidad creada desde ruta (${localidadRuta.tipo})`,
      observaciones: `Creada automáticamente desde el módulo de rutas`
    };

    try {
      console.log(`🔄 Intentando crear localidad en backend: ${localidadRuta.nombre}`);
      
      const localidadCreada = await this.http.post<Localidad>(`${this.apiUrl}/localidades`, nuevaLocalidad).pipe(
        catchError(error => {
          console.warn(`⚠️ Error creando localidad "${localidadRuta.nombre}" en backend:`, error);
          // Retornar localidad temporal en caso de error
          return of(this.crearLocalidadTemporal(localidadRuta));
        })
      ).toPromise();
      
      if (!localidadCreada) {
        console.warn(`⚠️ Backend no retornó localidad para "${localidadRuta.nombre}", creando temporal`);
        return this.crearLocalidadTemporal(localidadRuta);
      }
      
      console.log(`✅ Localidad creada exitosamente: ${localidadCreada.nombre} (ID: ${localidadCreada.id})`);
      return localidadCreada;
      
    } catch (error) {
      console.error(`❌ Error creando localidad "${localidadRuta.nombre}":`, error);
      // Crear localidad temporal para no bloquear el proceso
      return this.crearLocalidadTemporal(localidadRuta);
    }
  }

  /**
   * Crea una localidad temporal cuando falla la creación en el backend
   */
  private crearLocalidadTemporal(localidadRuta: LocalidadRuta): Localidad {
    const localidadTemporal: Localidad = {
      id: this.generarIdTemporal(),
      nombre: localidadRuta.nombre,
      departamento: localidadRuta.departamento || 'NO_ESPECIFICADO',
      provincia: localidadRuta.provincia || 'NO_ESPECIFICADO',
      distrito: localidadRuta.distrito || 'NO_ESPECIFICADO',
      municipalidad_centro_poblado: localidadRuta.nombre,
      nivel_territorial: this.determinarNivelTerritorial(localidadRuta),
      esta_activa: true,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };
    
    console.log(`🔧 Localidad temporal creada: ${localidadTemporal.nombre} (ID: ${localidadTemporal.id})`);
    return localidadTemporal;
  }

  /**
   * Actualiza el cache de localidades
   */
  private async actualizarCache(): Promise<void> {
    // Evitar múltiples actualizaciones simultáneas
    if (this.cacheActualizado || this.actualizandoCache) {
      return;
    }

    this.actualizandoCache = true;

    try {
      console.log('🔄 Actualizando cache de localidades...');
      
      // Timeout de 10 segundos para evitar cuelgues
      const localidades = await this.http.get<Localidad[]>(`${this.apiUrl}/localidades`).pipe(
        catchError(error => {
          console.warn('⚠️ Error cargando localidades del backend (usando cache vacío):', error.status || error.message);
          return of([]);
        })
      ).toPromise();
      
      this.localidadesCache.next(localidades || []);
      this.cacheActualizado = true;
      
      console.log(`✅ Cache actualizado con ${localidades?.length || 0} localidades`);
    } catch (error) {
      console.error('❌ Error actualizando cache de localidades:', error);
      // Continuar con cache vacío para no bloquear el sistema
      this.localidadesCache.next([]);
      this.cacheActualizado = true;
    } finally {
      this.actualizandoCache = false;
    }
  }

  /**
   * Fuerza la actualización del cache
   */
  async refrescarCache(): Promise<void> {
    console.log('🔄 Forzando actualización del cache...');
    this.cacheActualizado = false;
    this.actualizandoCache = false;
    await this.actualizarCache();
  }

  /**
   * Obtiene las localidades del cache
   */
  getLocalidadesCache(): Observable<Localidad[]> {
    return this.localidadesCache.asObservable();
  }

  /**
   * Busca localidades por nombre
   */
  async buscarLocalidadesPorNombre(nombre: string): Promise<Localidad[]> {
    await this.actualizarCache();
    
    const nombreNormalizado = this.normalizarNombre(nombre);
    const localidades = this.localidadesCache.value;
    
    return localidades.filter(loc => 
      this.normalizarNombre(loc.nombre || '').includes(nombreNormalizado)
    );
  }

  /**
   * Verifica si una localidad ya existe
   */
  async existeLocalidad(nombre: string): Promise<boolean> {
    await this.actualizarCache();
    
    const nombreNormalizado = this.normalizarNombre(nombre);
    const localidades = this.localidadesCache.value;
    
    return localidades.some(loc => 
      this.normalizarNombre(loc.nombre || '') === nombreNormalizado
    );
  }

  /**
   * Obtiene estadísticas de localidades
   */
  async obtenerEstadisticas(): Promise<any> {
    await this.actualizarCache();
    
    const localidades = this.localidadesCache.value;
    
    return {
      total_localidades: localidades.length,
      por_departamento: this.agruparPor(localidades, 'departamento'),
      por_provincia: this.agruparPor(localidades, 'provincia'),
      por_tipo: this.agruparPor(localidades, 'tipo'),
      activas: localidades.filter(loc => loc.esta_activa).length,
      inactivas: localidades.filter(loc => !loc.esta_activa).length
    };
  }

  // Métodos auxiliares privados

  private normalizarNombre(nombre: string): string {
    return nombre.toLowerCase().trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  private determinarNivelTerritorial(localidadRuta: LocalidadRuta): any {
    if (localidadRuta.distrito && localidadRuta.distrito !== 'NO_ESPECIFICADO') {
      return 'DISTRITO';
    } else if (localidadRuta.provincia && localidadRuta.provincia !== 'NO_ESPECIFICADO') {
      return 'PROVINCIA';
    } else if (localidadRuta.departamento && localidadRuta.departamento !== 'NO_ESPECIFICADO') {
      return 'DEPARTAMENTO';
    } else {
      return 'CENTRO_POBLADO';
    }
  }

  private determinarTipoLocalidad(nombre: string): any {
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes('ciudad') || nombreLower.includes('capital')) {
      return 'CIUDAD';
    } else if (nombreLower.includes('distrito')) {
      return 'DISTRITO';
    } else if (nombreLower.includes('provincia')) {
      return 'PROVINCIA';
    } else if (nombreLower.includes('departamento')) {
      return 'DEPARTAMENTO';
    } else {
      return 'PUEBLO';
    }
  }

  private generarIdTemporal(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private agruparPor(array: any[], campo: string): { [key: string]: number } {
    return array.reduce((acc, item) => {
      const valor = item[campo] || 'NO_ESPECIFICADO';
      acc[valor] = (acc[valor] || 0) + 1;
      return acc;
    }, {});
  }
}