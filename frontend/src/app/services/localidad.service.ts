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

  constructor(private http: HttpClient) {}

  // ========================================
  // MÉTODOS PRINCIPALES CONSOLIDADOS
  // ========================================

  /**
   * MÉTODO ÚNICO: Obtener localidades con cache inteligente
   */
  async obtenerLocalidades(filtros?: FiltroLocalidades, forzarActualizacion = false): Promise<Localidad[]> {
    try {
      // Si hay filtros específicos, hacer consulta directa
      if (filtros && (filtros.nombre || filtros.tipo || filtros.departamento)) {
        return await this.consultarLocalidadesConFiltros(filtros);
      }

      // Para consultas generales, usar cache
      if (!this.cacheActualizado || forzarActualizacion) {
        await this.actualizarCache();
      }

      return this.localidadesCache.value;
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
      // Si el término es muy corto, buscar en cache
      if (termino.length < 3) {
        await this.actualizarCache();
        const terminoNormalizado = this.normalizarTexto(termino);
        return this.localidadesCache.value
          .filter(loc => this.normalizarTexto(loc.nombre || '').includes(terminoNormalizado))
          .slice(0, limite);
      }

      // Para términos más largos, consultar backend
      const params = new HttpParams()
        .set('q', termino)
        .set('limite', limite.toString());
      
      const resultado = await this.http.get<Localidad[]>(`${this.apiUrl}/buscar`, { params }).toPromise();
      return resultado || [];
    } catch (error) {
      console.error('❌ Error buscando localidades::', error);
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
  // MÉTODOS DE COMPATIBILIDAD (DEPRECATED)
  // ========================================

  /**
   * @deprecated Usar obtenerLocalidades() en su lugar
   */
  getLocalidades(): Observable<Localidad[]> {
    console.warn('⚠️ getLocalidades() está deprecated. Usar obtenerLocalidades()');
    return this.localidadesCache.asObservable();
  }

  /**
   * @deprecated Usar obtenerLocalidades() con filtros en su lugar
   */
  getLocalidadesActivas(): Observable<Localidad[]> {
    console.warn('⚠️ getLocalidadesActivas() está deprecated. Usar obtenerLocalidades()');
    return this.localidadesCache.asObservable().pipe(
      map(localidades => localidades.filter(l => l.esta_activa))
    );
  }

  // ========================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ========================================

  private async actualizarCache(): Promise<void> {
    if (this.actualizandoCache) return;

    this.actualizandoCache = true;
    try {
      // console.log removed for production
      
      const localidades = await this.http.get<Localidad[]>(this.apiUrl).pipe(
        catchError(error => {
          console.warn('⚠️ Error cargando localidades del backend:', error);
          return of([]);
        })
      ).toPromise();
      
      this.localidadesCache.next(localidades || []);
      this.cacheActualizado = true;
      
      // console.log removed for production
    } catch (error) {
      console.error('❌ Error actualizando cache::', error);
      this.localidadesCache.next([]);
    } finally {
      this.actualizandoCache = false;
    }
  }

  private async consultarLocalidadesConFiltros(filtros: FiltroLocalidades): Promise<Localidad[]> {
    let params = new HttpParams();
    
    if (filtros.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.departamento) params = params.set('departamento', filtros.departamento);
    if (filtros.provincia) params = params.set('provincia', filtros.provincia);
    if (filtros.nivel_territorial) params = params.set('nivel_territorial', filtros.nivel_territorial);
    if (typeof filtros.esta_activa !== "undefined") params = params.set('esta_activa', filtros.esta_activa.toString());

    const resultado = await this.http.get<Localidad[]>(this.apiUrl, { params }).toPromise();
    return resultado || [];
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
      localidad.esta_activa = !localidad.esta_activa;
      this.localidadesCache.next([...localidades]);
    }
  }

  // Métodos específicos mantenidos sin cambios
  async obtenerLocalidadesPaginadas(pagina: number = 1, limite: number = 10, filtros?: FiltroLocalidades): Promise<LocalidadesPaginadas> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());
    
    if (filtros) {
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.tipo) params = params.set('tipo', filtros.tipo);
      if (filtros.departamento) params = params.set('departamento', filtros.departamento);
      if (filtros.provincia) params = params.set('provincia', filtros.provincia);
      if (filtros.nivel_territorial) params = params.set('nivel_territorial', filtros.nivel_territorial);
      if (typeof filtros.esta_activa !== "undefined") params = params.set('esta_activa', filtros.esta_activa.toString());
    }

    return this.http.get<LocalidadesPaginadas>(`${this.apiUrl}/paginadas`, { params }).toPromise() as Promise<LocalidadesPaginadas>;
  }

  async validarUbigeoUnico(ubigeo: string, idExcluir?: string): Promise<RespuestaValidacionUbigeo> {
    const validacion: ValidacionUbigeo = { ubigeo, idExcluir };
    return this.http.post<RespuestaValidacionUbigeo>(`${this.apiUrl}/validar-ubigeo`, validacion).toPromise() as Promise<RespuestaValidacionUbigeo>;
  }

  async operacionesMasivas(operacion: 'activar' | 'desactivar' | 'eliminar', ids: string[]): Promise<any> {
    let params = new HttpParams().set('operacion', operacion);
    ids.forEach(id => params = params.append('ids', id));
    
    const resultado = await this.http.post(`${this.apiUrl}/operaciones-masivas`, null, { params }).toPromise();
    
    // Actualizar cache después de operaciones masivas
    await this.actualizarCache();
    
    return resultado;
  }

  async importarExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const resultado = await this.http.post(`${this.apiUrl}/importar-excel`, formData).toPromise();
    
    // Actualizar cache después de importar
    await this.actualizarCache();
    
    return resultado;
  }

  async exportarExcel(): Promise<void> {
    const response = await this.http.get(`${this.apiUrl}/exportar-excel`, { 
      responseType: 'blob' 
    }).toPromise() as Blob;

    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `localidades_${timestamp}.xlsx`;
    
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async calcularDistancia(origenId: string, destinoId: string): Promise<{ distancia: number; unidad: string }> {
    return this.http.get<{ distancia: number; unidad: string }>(`${this.apiUrl}/${origenId}/distancia/${destinoId}`).toPromise() as Promise<{ distancia: number; unidad: string }>;
  }

  async inicializarLocalidadesDefault(): Promise<any> {
    const resultado = await this.http.post(`${this.apiUrl}/inicializar`, {}).toPromise();
    await this.actualizarCache();
    return resultado;
  }

  // Métodos de centros poblados mantenidos
  async importarCentrosPobladosINEI(): Promise<any> {
    const resultado = await this.http.post(`${this.apiUrl}/importar-centros-poblados-inei`, {
      departamento: 'PUNO'
    }).toPromise();
    await this.actualizarCache();
    return resultado;
  }

  async importarCentrosPobladosRENIEC(): Promise<any> {
    const resultado = await this.http.post(`${this.apiUrl}/importar-centros-poblados-reniec`, {
      departamento: 'PUNO'
    }).toPromise();
    await this.actualizarCache();
    return resultado;
  }

  async obtenerCentrosPobladosPorDistrito(distritoId: string): Promise<Localidad[]> {
    try {
      const resultado = await this.http.get<Localidad[]>(`${this.apiUrl}/centros-poblados/distrito/${distritoId}`).toPromise();
      return resultado || [];
    } catch (error) {
      console.error('Error obteniendo centros poblados por distrito::', error);
      return [];
    }
  }

  async sincronizarConBaseDatosOficial(fuente: 'INEI' | 'RENIEC' | 'MUNICIPALIDAD'): Promise<any> {
    const resultado = await this.http.post(`${this.apiUrl}/sincronizar-oficial`, {
      fuente,
      departamento: 'PUNO'
    }).toPromise();
    await this.actualizarCache();
    return resultado;
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
      console.error('Error obteniendo estadísticas de centros poblados::', error);
      return {
        totalCentrosPoblados: 0,
        porDistrito: [],
        porTipo: [],
        conCoordenadas: 0,
        sinCoordenadas: 0
      };
    }
  }

  async validarYLimpiarCentrosPoblados(): Promise<any> {
    const resultado = await this.http.post<any>(`${this.apiUrl}/validar-limpiar-centros-poblados`, {}).toPromise();
    await this.actualizarCache();
    return resultado || {
      procesados: 0,
      corregidos: 0,
      eliminados: 0,
      errores: []
    };
  }

  async importarCentrosPobladosArchivo(file: File, fuente: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fuente', fuente);
    formData.append('departamento', 'PUNO');

    const resultado = await this.http.post(`${this.apiUrl}/importar-centros-poblados-archivo`, formData).toPromise();
    await this.actualizarCache();
    return resultado;
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
      activas: localidades.filter(l => l.esta_activa).length,
      inactivas: localidades.filter(l => !l.esta_activa).length,
      cacheActualizado: this.cacheActualizado
    };
  }
}