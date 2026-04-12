import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Localidad,
  LocalidadCreate,
  LocalidadUpdate,
  LocalidadesPaginadas,
  FiltroLocalidades,
  ValidacionUbigeo,
  RespuestaValidacionUbigeo,
  TipoLocalidad,
  NivelTerritorial
} from '../models/localidad.model';

@Injectable({
  providedIn: 'root'
})
export class LocalidadService {
  private apiUrl = environment.apiUrl + '/localidades';

  // Cache unificado para todas las operaciones
  private localidadesCache = new BehaviorSubject<Localidad[]>([]);
  private cacheActualizado = false;
  private actualizandoCache = false;

  constructor(private http: HttpClient) { }

  // ========================================
  // MÉTODOS PRINCIPALES CONSOLIDADOS
  // ========================================

  /**
   * MÉTODO ÚNICO: Obtener localidades con cache inteligente
   * Por defecto EXCLUYE centros poblados para mejorar rendimiento
   * También expande los alias para que aparezcan en la lista
   */
  /**
   * Obtener el cache de localidades (para acceso directo sin cargar del servidor)
   */
  getLocalidadesCache(): Localidad[] {
    return this.localidadesCache.value;
  }

  /**
   * Obtener TODAS las localidades incluyendo centros poblados y aliases
   * Para estadísticas y filtros especiales
   */
  async obtenerTodasLasLocalidades(): Promise<Localidad[]> {
    try {
      // Cargar TODAS las localidades sin filtrar
      let params = new HttpParams().set('limit', '20000');
      
      const localidades = await this.http.get<Localidad[]>(this.apiUrl, { params }).pipe(
        catchError(error => {
          console.warn('⚠️ Error cargando todas las localidades:', error);
          return of([]);
        })
      ).toPromise();

      // Expandir aliases
      const localidadesConAliases = this.expandirAliases(localidades || []);
      
      console.log(`✅ Todas las localidades cargadas: ${localidadesConAliases.length} (incluyendo aliases)`);
      return localidadesConAliases;
    } catch (error) {
      console.error('❌ Error obteniendo todas las localidades:', error);
      return [];
    }
  }

  async obtenerLocalidades(filtros?: FiltroLocalidades, forzarActualizacion = false): Promise<Localidad[]> {
    try {
      // Si hay filtros específicos, hacer consulta directa
      if (filtros && (filtros.nombre || filtros.tipo || filtros.departamento)) {
        const resultado = await this.consultarLocalidadesConFiltros(filtros);
        // Expandir alias en resultados con filtros
        return this.expandirAliases(resultado);
      }

      // Para consultas generales, usar cache SIN centros poblados
      if (!this.cacheActualizado || forzarActualizacion) {
        await this.actualizarCache();
      }

      // Expandir aliases del cache
      return this.expandirAliases(this.localidadesCache.value);
    } catch (error) {
      console.error('❌ Error obteniendo localidades::', error);
      return [];
    }
  }

  /**
   * MÉTODO ÚNICO: Buscar localidades (reemplaza todos los métodos de búsqueda)
   */
  async buscarLocalidades(termino: string, limite: number = 10): Promise<Localidad[]> {
    try {
      if (!termino || termino.length < 2) {
        return [];
      }

      // Usar el endpoint correcto de búsqueda con alias
      const params = new HttpParams()
        .set('q', termino)
        .set('limite', limite.toString());

      const resultado = await this.http.get<Localidad[]>(`${this.apiUrl}/buscar`, { params }).toPromise();
      console.log('✅ Resultados de búsqueda:', resultado);
      
      // Expandir resultados: si tiene aliases (plural), crear una entrada por cada alias
      const resultadosExpandidos: Localidad[] = [];
      
      for (const localidad of resultado || []) {
        // Siempre agregar la versión original
        resultadosExpandidos.push(localidad);
        
        // Si tiene aliases, agregar una versión por cada alias (usando notación de corchetes)
        if (localidad.metadata?.['aliases'] && Array.isArray(localidad.metadata['aliases'])) {
          // Necesitamos obtener los IDs de los alias desde el backend
          // Por ahora, crear las opciones con el alias como nombre
          for (let i = 0; i < localidad.metadata['aliases'].length; i++) {
            const alias = localidad.metadata['aliases'][i];
            const localidadConAlias: Localidad = {
              ...localidad,
              nombre: alias,
              metadata: {
                ['es_alias']: true,
                ['alias_usado']: alias  // Temporal, se reemplazará con alias_id al guardar
              }
            } as Localidad;
            
            resultadosExpandidos.push(localidadConAlias);
          }
        }
      }
      
      return resultadosExpandidos;
    } catch (error) {
      console.error('❌ Error buscando localidades:', error);
      return [];
    }
  }

  /**
   * MÉTODO ÚNICO: Crear localidad (reemplaza todos los métodos de creación)
   */
  async crearLocalidad(localidad: LocalidadCreate): Promise<Localidad> {
    try {
      // console.log removed for production

      const nuevaLocalidad = await this.http.post<Localidad>(this.apiUrl, localidad).toPromise();

      if (nuevaLocalidad) {
        // Actualizar cache
        const localidadesActuales = this.localidadesCache.value;
        this.localidadesCache.next([...localidadesActuales, nuevaLocalidad]);

        // console.log removed for production
        return nuevaLocalidad;
      }

      throw new Error('Backend no retornó la localidad creada');
    } catch (error) {
      console.error('❌ Error creando localidad::', error);
      throw error;
    }
  }

  /**
   * MÉTODO ÚNICO: Verificar si existe localidad
   */
  async existeLocalidad(nombre: string): Promise<Localidad | null> {
    try {
      await this.actualizarCache();

      const nombreNormalizado = this.normalizarTexto(nombre);
      const localidadExistente = this.localidadesCache.value.find(loc =>
        this.normalizarTexto(loc.nombre || '') === nombreNormalizado
      );

      return localidadExistente || null;
    } catch (error) {
      console.error('❌ Error verificando existencia de localidad::', error);
      return null;
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ========================================

  private async actualizarCache(): Promise<void> {
    if (this.actualizandoCache) return;

    this.actualizandoCache = true;
    try {
      // Cargar TODAS las localidades sin filtrar
      let params = new HttpParams().set('limit', '10000');
      
      const localidades = await this.http.get<Localidad[]>(this.apiUrl, { params }).pipe(
        catchError(error => {
          console.warn('⚠️ Error cargando localidades del backend:', error);
          return of([]);
        })
      ).toPromise();

      // Expandir aliases antes de guardar en cache
      const localidadesConAliases = this.expandirAliases(localidades || []);
      
      this.localidadesCache.next(localidadesConAliases);
      this.cacheActualizado = true;

      console.log(`✅ Cache actualizado: ${localidadesConAliases.length} localidades (incluyendo aliases)`);
    } catch (error) {
      console.error('❌ Error actualizando cache::', error);
      this.localidadesCache.next([]);
    } finally {
      this.actualizandoCache = false;
    }
  }

  private async consultarLocalidadesConFiltros(filtros: FiltroLocalidades): Promise<Localidad[]> {
    let params = new HttpParams().set('limit', '10000');

    if (filtros.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.departamento) params = params.set('departamento', filtros.departamento);
    if (filtros.provincia) params = params.set('provincia', filtros.provincia);
    if (filtros.nivelTerritorial) params = params.set('nivelTerritorial', filtros.nivelTerritorial);
    if (typeof filtros.estaActiva !== "undefined") params = params.set('estaActiva', filtros.estaActiva.toString());

    const resultado = await this.http.get<Localidad[]>(this.apiUrl, { params }).toPromise();
    // Expandir aliases en resultados con filtros
    return this.expandirAliases(resultado || []);
  }

  private normalizarTexto(texto: string): string {
    return texto.toLowerCase().trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Expande los aliases de localidades creando entradas separadas
   * Cada alias se convierte en una localidad con metadata.es_alias = true
   */
  private expandirAliases(localidades: Localidad[]): Localidad[] {
    const resultado: Localidad[] = [];
    
    for (const localidad of localidades) {
      // Siempre agregar la versión original
      resultado.push(localidad);
      
      // Si tiene aliases en metadata, crear una entrada por cada alias
      const aliases = localidad.metadata?.['aliases'] as string[] | undefined;
      if (aliases && Array.isArray(aliases)) {
        for (const alias of aliases) {
          const localidadConAlias: Localidad = {
            ...localidad,
            nombre: alias,
            metadata: {
              ...localidad.metadata,
              es_alias: true,
              alias_usado: alias,
              localidad_id: localidad.id,
              localidad_nombre: localidad.nombre
            }
          };
          resultado.push(localidadConAlias);
        }
      }
    }
    
    return resultado;
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS MANTENIDOS
  // ========================================

  async obtenerLocalidadPorId(id: string): Promise<Localidad> {
    return this.http.get<Localidad>(`${this.apiUrl}/${id}`).toPromise() as Promise<Localidad>;
  }

  async actualizarLocalidad(id: string, localidad: LocalidadUpdate): Promise<Localidad> {
    const resultado = await this.http.put<Localidad>(`${this.apiUrl}/${id}`, localidad).toPromise();

    if (!resultado) {
      throw new Error('No se pudo actualizar la localidad');
    }

    // Actualizar cache
    const localidades = this.localidadesCache.value;
    const index = localidades.findIndex(l => l.id === id);
    if (index !== -1) {
      localidades[index] = resultado;
      this.localidadesCache.next([...localidades]);
    }

    return resultado;
  }

  async eliminarLocalidad(id: string): Promise<void> {
    await this.http.delete(`${this.apiUrl}/${id}`).toPromise();

    // Actualizar cache
    const localidades = this.localidadesCache.value.filter(l => l.id !== id);
    this.localidadesCache.next(localidades);
  }

  async toggleEstadoLocalidad(id: string): Promise<void> {
    await this.http.patch(`${this.apiUrl}/${id}/toggle-estado`, {}).toPromise();

    // Actualizar cache
    const localidades = this.localidadesCache.value;
    const localidad = localidades.find(l => l.id === id);
    if (localidad) {
      localidad.estaActiva = !localidad.estaActiva;
      this.localidadesCache.next([...localidades]);
    }
  }

  // Métodos específicos mantenidos
  async obtenerLocalidadesPaginadas(pagina: number = 1, limite: number = 10, filtros?: FiltroLocalidades): Promise<LocalidadesPaginadas> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (filtros) {
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.tipo) params = params.set('tipo', filtros.tipo);
      if (filtros.departamento) params = params.set('departamento', filtros.departamento);
      if (filtros.provincia) params = params.set('provincia', filtros.provincia);
      if (filtros.nivelTerritorial) params = params.set('nivelTerritorial', filtros.nivelTerritorial);
      if (typeof filtros.estaActiva !== "undefined") params = params.set('estaActiva', filtros.estaActiva.toString());
    }

    return this.http.get<LocalidadesPaginadas>(`${this.apiUrl}/paginadas`, { params }).toPromise() as Promise<LocalidadesPaginadas>;
  }

  async importarExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const resultado = await this.http.post(`${this.apiUrl}/importar-excel`, formData).toPromise();

    // Actualizar cache después de importar
    await this.actualizarCache();

    return resultado;
  }

  /**
   * Verificar si una localidad está en uso en rutas
   */
  async verificarUsoLocalidad(id: string): Promise<{
    en_uso: boolean;
    rutas_como_origen: number;
    rutas_como_destino: number;
    rutas_en_itinerario: number;
    rutas_afectadas: any[];
  }> {
    try {
      const resultado = await this.http.get<any>(`${this.apiUrl}/${id}/verificar-uso`).toPromise();
      return resultado || {
        en_uso: false,
        rutas_como_origen: 0,
        rutas_como_destino: 0,
        rutas_en_itinerario: 0,
        rutas_afectadas: []
      };
    } catch (error) {
      console.error('Error verificando uso de localidad:', error);
      return {
        en_uso: false,
        rutas_como_origen: 0,
        rutas_como_destino: 0,
        rutas_en_itinerario: 0,
        rutas_afectadas: []
      };
    }
  }

  async inicializarLocalidadesDefault(): Promise<any> {
    const resultado = await this.http.post(`${this.apiUrl}/inicializar`, {}).toPromise();
    await this.actualizarCache();
    return resultado;
  }

  // Métodos de centros poblados consolidados
  async importarCentrosPoblados(fuente: 'INEI' | 'RENIEC' | 'ARCHIVO' = 'INEI', file?: File): Promise<any> {
    try {
      let resultado: any;

      if (fuente === 'ARCHIVO' && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fuente', fuente);
        formData.append('departamento', 'PUNO');
        resultado = await this.http.post(`${this.apiUrl}/importar-centros-poblados-archivo`, formData).toPromise();
      } else {
        const endpoint = fuente === 'RENIEC' 
          ? `${this.apiUrl}/importar-centros-poblados-reniec`
          : `${this.apiUrl}/importar-centros-poblados-inei`;
        
        resultado = await this.http.post(endpoint, { departamento: 'PUNO' }).toPromise();
      }

      await this.actualizarCache();
      return resultado;
    } catch (error) {
      console.error(`Error importando centros poblados (${fuente}):`, error);
      throw error;
    }
  }

  async obtenerCentrosPobladosPorDistrito(distritoId: string): Promise<Localidad[]> {
    try {
      const resultado = await this.http.get<Localidad[]>(`${this.apiUrl}/centros-poblados/distrito/${distritoId}`).toPromise();
      return resultado || [];
    } catch (error) {
      console.error('Error obteniendo centros poblados por distrito:', error);
      return [];
    }
  }

  async obtenerEstadisticasCentrosPoblados(): Promise<any> {
    try {
      const resultado = await this.http.get<any>(`${this.apiUrl}/estadisticas-centros-poblados`).toPromise();
      return resultado || {
        totalCentrosPoblados: 0,
        porDistrito: [],
        porTipo: [],
        conCoordenadas: 0,
        sinCoordenadas: 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de centros poblados:', error);
      return {
        totalCentrosPoblados: 0,
        porDistrito: [],
        porTipo: [],
        conCoordenadas: 0,
        sinCoordenadas: 0
      };
    }
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA CACHE
  // ========================================

  /**
   * Fuerza la actualización del cache
   */
  async refrescarCache(): Promise<void> {
    this.cacheActualizado = false;
    await this.actualizarCache();
  }

  /**
   * Obtiene el observable del cache para componentes que necesiten reactividad
   */
  getLocalidadesObservable(): Observable<Localidad[]> {
    return this.localidadesCache.asObservable();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getEstadisticasCache(): { total: number; activas: number; inactivas: number; cacheActualizado: boolean } {
    const localidades = this.localidadesCache.value;
    return {
      total: localidades.length,
      activas: localidades.filter(l => l.estaActiva).length,
      inactivas: localidades.filter(l => !l.estaActiva).length,
      cacheActualizado: this.cacheActualizado
    };
  }
}
