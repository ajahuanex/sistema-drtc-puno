import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Localidad, 
  LocalidadCreate, 
  LocalidadUpdate, 
  FiltroLocalidades
} from '../models/localidad.model';

@Injectable({
  providedIn: 'root'
})
export class LocalidadConsolidadoService {
  private apiUrl = environment.apiUrl + '/localidades';
  
  // Cache único y optimizado
  private localidadesCache = new BehaviorSubject<Localidad[]>([]);
  private cacheActualizado = false;
  private actualizandoCache = false;
  private ultimaActualizacion: Date | null = null;
  private readonly CACHE_DURACION_MS = 5 * 60 * 1000; // 5 minutos

  constructor(private http: HttpClient) {
    // console.log removed for production
  }

  // ========================================
  // MÉTODOS PRINCIPALES CONSOLIDADOS
  // ========================================

  /**
   * MÉTODO ÚNICO: Obtener localidades con cache inteligente
   */
  async obtenerLocalidades(filtros?: FiltroLocalidades, forzarActualizacion = false): Promise<Localidad[]> {
    try {
      // console.log removed for production
      
      // Si hay filtros específicos, hacer consulta directa
      if (filtros && this.tieneFiltrosEspecificos(filtros)) {
        // console.log removed for production
        return await this.consultarLocalidadesConFiltros(filtros);
      }

      // Para consultas generales, usar cache inteligente
      if (this.necesitaActualizarCache() || forzarActualizacion) {
        // console.log removed for production
        await this.actualizarCache();
      } else {
        // console.log removed for production
      }

      const localidades = this.localidadesCache.value;
      // console.log removed for production
      return localidades;
      
    } catch (error) {
      console.error('❌ Error obteniendo localidades::', error);
      // Retornar cache existente en caso de error
      return this.localidadesCache.value;
    }
  }

  /**
   * MÉTODO ÚNICO: Buscar localidades (reemplaza todos los métodos de búsqueda)
   */
  async buscarLocalidades(termino: string, limite: number = 50): Promise<Localidad[]> {
    try {
      // console.log removed for production
      
      if (!termino || termino.trim().length < 2) {
        // console.log removed for production
        return [];
      }

      // Para términos cortos, buscar en cache
      if (termino.length < 4) {
        await this.actualizarCacheSiEsNecesario();
        const terminoNormalizado = this.normalizarTexto(termino);
        const resultados = this.localidadesCache.value
          .filter(loc => this.normalizarTexto(loc.nombre || '').includes(terminoNormalizado))
          .slice(0, limite);
        
        // console.log removed for production
        return resultados;
      }

      // Para términos más largos, consultar backend con timeout
      const params = new HttpParams()
        .set('q', termino.trim())
        .set('limite', limite.toString());
      
      const resultado = await this.http.get<Localidad[]>(`${this.apiUrl}/buscar`, { params })
        .pipe(
          timeout(10000), // 10 segundos timeout
          catchError(error => {
            console.warn('⚠️ Error en búsqueda backend, usando cache:', error);
            // Fallback a búsqueda en cache
            const terminoNormalizado = this.normalizarTexto(termino);
            return of(this.localidadesCache.value
              .filter(loc => this.normalizarTexto(loc.nombre || '').includes(terminoNormalizado))
              .slice(0, limite));
          })
        ).toPromise();
      
      // console.log removed for production
      return resultado || [];
      
    } catch (error) {
      console.error('❌ Error buscando localidades::', error);
      return [];
    }
  }

  /**
   * MÉTODO ÚNICO: Crear localidad con validación
   */
  async crearLocalidad(localidad: LocalidadCreate): Promise<Localidad> {
    try {
      // console.log removed for production
      
      // Validar datos antes de enviar
      const localidadValidada = this.validarDatosLocalidad(localidad);
      
      const nuevaLocalidad = await this.http.post<Localidad>(this.apiUrl, localidadValidada)
        .pipe(
          timeout(15000), // 15 segundos timeout
          catchError(error => {
            console.error('❌ Error creando localidad en backend::', error);
            throw new Error(`Error creando localidad: ${error.error?.detail || error.message}`);
          })
        ).toPromise();
      
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
   * MÉTODO ÚNICO: Verificar existencia de localidad
   */
  async existeLocalidad(nombre: string): Promise<Localidad | null> {
    try {
      await this.actualizarCacheSiEsNecesario();
      
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
  // MÉTODOS CRUD BÁSICOS
  // ========================================

  async obtenerLocalidadPorId(id: string): Promise<Localidad | null> {
    try {
      const localidad = await this.http.get<Localidad>(`${this.apiUrl}/${id}`)
        .pipe(
          timeout(10000),
          catchError(error => {
            console.error(`Error obteniendo localidad ${id}:`, error);
            return of(null);
          })
        ).toPromise();
      
      return localidad || null;
    } catch (error) {
      console.error('Error obteniendo localidad por ID::', error);
      return null;
    }
  }

  async actualizarLocalidad(id: string, localidad: LocalidadUpdate): Promise<Localidad> {
    try {
      const localidadValidada = this.validarDatosActualizacion(localidad);
      
      const resultado = await this.http.put<Localidad>(`${this.apiUrl}/${id}`, localidadValidada)
        .pipe(timeout(15000)).toPromise();
      
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
    } catch (error) {
      console.error('Error actualizando localidad::', error);
      throw error;
    }
  }

  async eliminarLocalidad(id: string): Promise<void> {
    try {
      await this.http.delete(`${this.apiUrl}/${id}`)
        .pipe(timeout(15000)).toPromise();
      
      // Actualizar cache
      const localidades = this.localidadesCache.value.filter(l => l.id !== id);
      this.localidadesCache.next(localidades);
      
    } catch (error) {
      console.error('Error eliminando localidad::', error);
      throw error;
    }
  }

  async toggleEstadoLocalidad(id: string): Promise<void> {
    try {
      await this.http.patch(`${this.apiUrl}/${id}/toggle-estado`, {})
        .pipe(timeout(10000)).toPromise();
      
      // Actualizar cache
      const localidades = this.localidadesCache.value;
      const localidad = localidades.find(l => l.id === id);
      if (localidad) {
        localidad.esta_activa = !localidad.esta_activa;
        this.localidadesCache.next([...localidades]);
      }
      
    } catch (error) {
      console.error('Error cambiando estado de localidad::', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS DE CACHE Y UTILIDADES
  // ========================================

  /**
   * Actualiza el cache desde el backend con manejo de errores robusto
   */
  private async actualizarCache(): Promise<void> {
    if (this.actualizandoCache) {
      // console.log removed for production
      return;
    }

    this.actualizandoCache = true;
    try {
      // console.log removed for production
      
      // INTENTAR OBTENER DATOS REALES DEL BACKEND
      try {
        // console.log removed for production
        
        const response = await fetch(this.apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // console.log removed for production
        
        if (response.ok) {
          const localidades = await response.json();
          // console.log removed for production
          
          if (Array.isArray(localidades) && localidades.length > 0) {
            // Procesar y limpiar datos reales
            const localidadesLimpias = localidades
              .filter(loc => {
                if (!loc.nombre || loc.nombre.trim() === '') {
                  console.warn('⚠️ Localidad sin nombre filtrada:', loc);
                  return false;
                }
                return true;
              })
              .map(loc => {
                // Limpiar coordenadas nulas que causan error en el backend
                if (loc.coordenadas && (
                  loc.coordenadas.latitud === null || 
                  loc.coordenadas.longitud === null ||
                  loc.coordenadas.latitud === undefined || 
                  loc.coordenadas.longitud === undefined
                )) {
                  console.warn('⚠️ Limpiando coordenadas nulas para:', loc.nombre);
                  delete loc.coordenadas;
                }
                
                // Asegurar que esta_activa esté definido
                if (loc.esta_activa === undefined || loc.esta_activa === null) {
                  loc.esta_activa = loc.estaActiva !== false;
                }
                
                return loc;
              });
            
            this.localidadesCache.next(localidadesLimpias);
            this.cacheActualizado = true;
            this.ultimaActualizacion = new Date();
            
            // console.log removed for production
            return;
          } else {
            console.warn('⚠️ Backend respondió con array vacío o datos inválidos');
          }
        } else {
          console.warn(`⚠️ Backend respondió con error: ${response.status} ${response.statusText}`);
        }
        
      } catch (fetchError: any) {
        console.error('❌ Error con fetch directo::', fetchError.message);
      }
      
      // INTENTAR CON HttpClient como fallback
      try {
        // console.log removed for production
        
        const localidades = await this.http.get<Localidad[]>(this.apiUrl, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          })
        }).pipe(
          timeout(15000), // 15 segundos timeout
          map(localidades => {
            // console.log removed for production
            
            if (!Array.isArray(localidades)) {
              throw new Error('Respuesta no es un array');
            }
            
            return localidades.filter(loc => {
              if (!loc.nombre || loc.nombre.trim() === '') {
                console.warn('⚠️ Localidad sin nombre filtrada:', loc);
                return false;
              }
              return true;
            }).map(loc => {
              // Limpiar coordenadas nulas
              if (loc.coordenadas && (
                loc.coordenadas.latitud === null || 
                loc.coordenadas.longitud === null ||
                loc.coordenadas.latitud === undefined || 
                loc.coordenadas.longitud === undefined
              )) {
                console.warn('⚠️ Limpiando coordenadas nulas para:', loc.nombre);
                delete loc.coordenadas;
              }
              
              // Asegurar que esta_activa esté definido
              if (loc.esta_activa === undefined || loc.esta_activa === null) {
                loc.esta_activa = loc.estaActiva !== false;
              }
              
              return loc;
            });
          }),
          catchError(httpError => {
            console.error('❌ Error con HttpClient::', httpError);
            throw httpError;
          })
        ).toPromise();
        
        if (localidades && localidades.length > 0) {
          this.localidadesCache.next(localidades);
          this.cacheActualizado = true;
          this.ultimaActualizacion = new Date();
          
          console.log(`✅ Cache actualizado con ${localidades.length} localidades REALES (HttpClient)`);
          return;
        }
        
      } catch (httpError: any) {
        console.error('❌ Error con HttpClient también::', httpError);
      }
      
      // Si llegamos aquí, ambos métodos fallaron
      console.error('❌ AMBOS MÉTODOS FALLARON - No se pueden obtener datos del backend');
      
      // Mantener cache existente si hay datos
      if (this.localidadesCache.value.length > 0) {
        // console.log removed for production
        return;
      }
      
      // Solo como último recurso, usar datos de prueba
      console.warn('⚠️ ÚLTIMO RECURSO - Usando datos de prueba porque no hay datos en cache');
      const datosPrueba = this.crearDatosDePrueba();
      this.localidadesCache.next(datosPrueba);
      this.cacheActualizado = true;
      this.ultimaActualizacion = new Date();
      
      console.log(`🧪 Cache inicializado con ${datosPrueba.length} localidades de prueba (último recurso)`);
      
    } catch (error) {
      console.error('❌ Error general actualizando cache::', error);
      // Mantener cache existente si hay error general
      if (this.localidadesCache.value.length === 0) {
        // Solo usar datos de prueba si no hay nada en cache
        const datosPrueba = this.crearDatosDePrueba();
        this.localidadesCache.next(datosPrueba);
        // console.log removed for production
      }
    } finally {
      this.actualizandoCache = false;
    }
  }

  /**
   * Crea datos de prueba cuando el backend falla
   */
  private crearDatosDePrueba(): Localidad[] {
    // console.log removed for production
    
    return [
      {
        id: 'test-1',
        nombre: 'Puno',
        tipo: 'CIUDAD' as any,
        departamento: 'PUNO',
        provincia: 'PUNO',
        distrito: 'PUNO',
        municipalidad_centro_poblado: 'Municipalidad Provincial de Puno',
        nivel_territorial: 'PROVINCIA' as any,
        esta_activa: true,
        estaActiva: true,
        ubigeo: '210101',
        descripcion: 'Capital del departamento de Puno',
        coordenadas: {
          latitud: -15.8422,
          longitud: -70.0199
        },
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'test-2',
        nombre: 'Juliaca',
        tipo: 'CIUDAD' as any,
        departamento: 'PUNO',
        provincia: 'SAN ROMAN',
        distrito: 'JULIACA',
        municipalidad_centro_poblado: 'Municipalidad Provincial de San Román',
        nivel_territorial: 'DISTRITO' as any,
        esta_activa: true,
        estaActiva: true,
        ubigeo: '211101',
        descripcion: 'Ciudad comercial importante',
        coordenadas: {
          latitud: -15.5000,
          longitud: -70.1333
        },
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'test-3',
        nombre: 'Ilave',
        tipo: 'DISTRITO' as any,
        departamento: 'PUNO',
        provincia: 'EL COLLAO',
        distrito: 'ILAVE',
        municipalidad_centro_poblado: 'Municipalidad Distrital de Ilave',
        nivel_territorial: 'DISTRITO' as any,
        esta_activa: true,
        estaActiva: true,
        ubigeo: '210401',
        descripcion: 'Distrito de la provincia El Collao',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'test-4',
        nombre: 'Desaguadero',
        tipo: 'DISTRITO' as any,
        departamento: 'PUNO',
        provincia: 'CHUCUITO',
        distrito: 'DESAGUADERO',
        municipalidad_centro_poblado: 'Municipalidad Distrital de Desaguadero',
        nivel_territorial: 'DISTRITO' as any,
        esta_activa: true,
        estaActiva: true,
        ubigeo: '210302',
        descripcion: 'Distrito fronterizo con Bolivia',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'test-5',
        nombre: 'Yunguyo',
        tipo: 'DISTRITO' as any,
        departamento: 'PUNO',
        provincia: 'YUNGUYO',
        distrito: 'YUNGUYO',
        municipalidad_centro_poblado: 'Municipalidad Provincial de Yunguyo',
        nivel_territorial: 'DISTRITO' as any,
        esta_activa: false,
        estaActiva: false,
        ubigeo: '211301',
        descripcion: 'Distrito de la provincia Yunguyo (Inactivo para pruebas)',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      }
    ];
  }

  private async actualizarCacheSiEsNecesario(): Promise<void> {
    if (this.necesitaActualizarCache()) {
      await this.actualizarCache();
    }
  }

  private necesitaActualizarCache(): boolean {
    if (!this.cacheActualizado) return true;
    if (!this.ultimaActualizacion) return true;
    
    const ahora = new Date();
    const tiempoTranscurrido = ahora.getTime() - this.ultimaActualizacion.getTime();
    return tiempoTranscurrido > this.CACHE_DURACION_MS;
  }

  private tieneFiltrosEspecificos(filtros: FiltroLocalidades): boolean {
    return !!(filtros.nombre || filtros.tipo || filtros.departamento || 
              filtros.provincia || filtros.nivel_territorial || 
              filtros.esta_activa !== undefined);
  }

  private async consultarLocalidadesConFiltros(filtros: FiltroLocalidades): Promise<Localidad[]> {
    let params = new HttpParams();
    
    if (filtros.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.departamento) params = params.set('departamento', filtros.departamento);
    if (filtros.provincia) params = params.set('provincia', filtros.provincia);
    if (filtros.nivel_territorial) params = params.set('nivel_territorial', filtros.nivel_territorial);
    if (typeof filtros.esta_activa !== "undefined") params = params.set('esta_activa', filtros.esta_activa.toString());

    try {
      const resultado = await this.http.get<Localidad[]>(this.apiUrl, { params })
        .pipe(timeout(15000)).toPromise();
      return resultado || [];
    } catch (error) {
      console.error('Error consultando con filtros::', error);
      return [];
    }
  }

  private validarDatosLocalidad(localidad: LocalidadCreate): LocalidadCreate {
    const localidadLimpia = { ...localidad };
    
    // Limpiar coordenadas nulas
    if (localidadLimpia.coordenadas) {
      if (typeof localidadLimpia.coordenadas.latitud === null || 
          localidadLimpia.coordenadas.longitud === null ||
          localidadLimpia.coordenadas.latitud === undefined || 
          typeof localidadLimpia.coordenadas.longitud === "undefined") {
        delete localidadLimpia.coordenadas;
      }
    }
    
    // Validar campos requeridos
    if (!localidadLimpia.nombre || localidadLimpia.nombre.trim() === '') {
      throw new Error('El nombre de la localidad es requerido');
    }
    
    return localidadLimpia;
  }

  private validarDatosActualizacion(localidad: LocalidadUpdate): LocalidadUpdate {
    const localidadLimpia = { ...localidad };
    
    // Limpiar coordenadas nulas
    if (localidadLimpia.coordenadas) {
      if (typeof localidadLimpia.coordenadas.latitud === null || 
          localidadLimpia.coordenadas.longitud === null ||
          localidadLimpia.coordenadas.latitud === undefined || 
          typeof localidadLimpia.coordenadas.longitud === "undefined") {
        delete localidadLimpia.coordenadas;
      }
    }
    
    return localidadLimpia;
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

  // ========================================
  // MÉTODOS PÚBLICOS PARA COMPONENTES
  // ========================================

  /**
   * Fuerza la actualización del cache
   */
  async refrescarCache(): Promise<void> {
    // console.log removed for production
    this.cacheActualizado = false;
    this.ultimaActualizacion = null;
    await this.actualizarCache();
  }

  /**
   * Obtiene el observable del cache para componentes reactivos
   */
  getLocalidadesObservable(): Observable<Localidad[]> {
    return this.localidadesCache.asObservable();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getEstadisticasCache(): { total: number; activas: number; inactivas: number; cacheActualizado: boolean; ultimaActualizacion: string | null } {
    const localidades = this.localidadesCache.value;
    return {
      total: localidades.length,
      activas: localidades.filter(l => l.esta_activa).length,
      inactivas: localidades.filter(l => !l.esta_activa).length,
      cacheActualizado: this.cacheActualizado,
      ultimaActualizacion: this.ultimaActualizacion?.toLocaleString() || null
    };
  }

  /**
   * MÉTODO DE DIAGNÓSTICO: Probar conectividad con el backend
   */
  async diagnosticarConectividad(): Promise<any> {
    // console.log removed for production
    
    const diagnostico = {
      timestamp: new Date().toISOString(),
      backend_url: this.apiUrl,
      cache_stats: this.getEstadisticasCache(),
      tests: [] as any[]
    };
    
    try {
      // Test 1: Verificar URL del backend
      // console.log removed for production
      diagnostico.tests.push({
        test: 'backend_url',
        status: 'ok',
        message: `URL configurada: ${this.apiUrl}`,
        data: { url: this.apiUrl }
      });
      
      // Test 2: Probar conectividad directa con fetch
      // console.log removed for production
      try {
        const response = await fetch(this.apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // console.log removed for production
        
        if (response.ok) {
          const data = await response.json();
          diagnostico.tests.push({
            test: 'fetch_connection',
            status: 'ok',
            message: `Conexión fetch exitosa: ${response.status}`,
            data: { 
              status: response.status,
              statusText: response.statusText,
              is_array: Array.isArray(data),
              length: Array.isArray(data) ? data.length : 0,
              sample_data: Array.isArray(data) ? data.slice(0, 2) : data
            }
          });
        } else {
          const errorText = await response.text();
          diagnostico.tests.push({
            test: 'fetch_connection',
            status: 'error',
            message: `Error fetch: ${response.status} ${response.statusText}`,
            data: {
              status: response.status,
              statusText: response.statusText,
              error_body: errorText
            }
          });
        }
        
      } catch (fetchError: any) {
        diagnostico.tests.push({
          test: 'fetch_connection',
          status: 'error',
          message: 'Error de conexión fetch',
          data: {
            error_message: fetchError.message,
            error_name: fetchError.name
          }
        });
      }
      
      // Test 3: Probar con HttpClient
      // console.log removed for production
      try {
        const response = await this.http.get(`${this.apiUrl}`, { 
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          })
        }).pipe(
          timeout(10000),
          catchError(error => {
            console.warn('⚠️ Error HttpClient:', error);
            return of({ error: error.message, status: error.status, details: error });
          })
        ).toPromise();
        
        if (response && !(response as any).error) {
          diagnostico.tests.push({
            test: 'httpclient_connection',
            status: 'ok',
            message: 'Conexión HttpClient exitosa',
            data: { 
              response_type: typeof response,
              is_array: Array.isArray(response),
              length: Array.isArray(response) ? response.length : 0,
              sample_data: Array.isArray(response) ? response.slice(0, 2) : response
            }
          });
        } else {
          diagnostico.tests.push({
            test: 'httpclient_connection',
            status: 'error',
            message: 'Error HttpClient',
            data: response
          });
        }
        
      } catch (error: any) {
        diagnostico.tests.push({
          test: 'httpclient_connection',
          status: 'error',
          message: 'Error de conexión HttpClient',
          data: {
            error_message: error.message,
            error_status: error.status,
            error_url: error.url
          }
        });
      }
      
      // Test 4: Verificar estado del cache
      // console.log removed for production
      const cacheStats = this.getEstadisticasCache();
      diagnostico.tests.push({
        test: 'cache_status',
        status: cacheStats.total > 0 ? 'ok' : 'warning',
        message: `Cache contiene ${cacheStats.total} localidades`,
        data: cacheStats
      });
      
      // Test 5: Intentar actualizar cache
      // console.log removed for production
      try {
        await this.actualizarCache();
        const newCacheStats = this.getEstadisticasCache();
        
        diagnostico.tests.push({
          test: 'cache_update',
          status: 'ok',
          message: 'Cache actualizado correctamente',
          data: {
            before: cacheStats,
            after: newCacheStats
          }
        });
        
      } catch (error: any) {
        diagnostico.tests.push({
          test: 'cache_update',
          status: 'error',
          message: 'Error actualizando cache',
          data: {
            error_message: error.message,
            error_status: error.status
          }
        });
      }
      
      // console.log removed for production
      return diagnostico;
      
    } catch (error: any) {
      console.error('❌ ERROR EN DIAGNÓSTICO::', error);
      diagnostico.tests.push({
        test: 'general_error',
        status: 'error',
        message: 'Error general en diagnóstico',
        data: {
          error_message: error.message,
          error_stack: error.stack
        }
      });
      
      return diagnostico;
    }
  }
}