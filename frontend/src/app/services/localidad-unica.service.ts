import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LocalidadService } from './localidad.service';
import { Localidad, LocalidadCreate } from '../models/localidad.model';

export interface LocalidadRutaData {
  nombre: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  empresaId: string;
  rutaId: string;
  tipo: 'ORIGEN' | 'DESTINO' | 'ITINERARIO';
}

export interface ResultadoProcesamiento {
  localidadId: string;
  nombre: string;
  esNueva: boolean;
  empresaOrigen: string;
  rutaOrigen: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalidadUnicaService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private localidadService: LocalidadService
  ) {}

  /**
   * Procesa una localidad desde una ruta, asegurando que sea única en el sistema
   * Si existe una localidad con el mismo nombre, la reutiliza
   * Si no existe, crea una nueva
   */
  async procesarLocalidadDesdeRuta(data: LocalidadRutaData): Promise<ResultadoProcesamiento> {
    try {
      // 1. Buscar si ya existe una localidad con el mismo nombre
      const localidadExistente = await this.buscarLocalidadPorNombre(data.nombre);
      
      if (localidadExistente) {
        // La localidad ya existe, la reutilizamos
        // console.log removed for production
        
        return {
          localidadId: localidadExistente.id,
          nombre: localidadExistente.nombre || data.nombre,
          esNueva: false,
          empresaOrigen: data.empresaId,
          rutaOrigen: data.rutaId
        };
      } else {
        // La localidad no existe, crear una nueva
        // console.log removed for production
        
        const nuevaLocalidad = await this.crearNuevaLocalidad(data);
        
        return {
          localidadId: nuevaLocalidad.id,
          nombre: nuevaLocalidad.nombre || data.nombre,
          esNueva: true,
          empresaOrigen: data.empresaId,
          rutaOrigen: data.rutaId
        };
      }
    } catch (error) {
      console.error('❌ Error procesando localidad desde ruta::', error);
      throw error;
    }
  }

  /**
   * Procesa múltiples localidades desde una ruta
   */
  async procesarLocalidadesDesdeRuta(localidades: LocalidadRutaData[]): Promise<ResultadoProcesamiento[]> {
    const resultados: ResultadoProcesamiento[] = [];
    
    for (const localidad of localidades) {
      try {
        const resultado = await this.procesarLocalidadDesdeRuta(localidad);
        resultados.push(resultado);
      } catch (error) {
        console.error(`❌ Error procesando localidad "${localidad.nombre}":`, error);
        // Continuar con las demás localidades
      }
    }
    
    return resultados;
  }

  /**
   * Busca una localidad por nombre exacto (case-insensitive)
   */
  private async buscarLocalidadPorNombre(nombre: string): Promise<Localidad | null> {
    try {
      const localidades = await this.localidadService.buscarLocalidades(nombre);
      
      // Buscar coincidencia exacta (case-insensitive)
      const coincidenciaExacta = localidades.find(loc => 
        (loc.nombre || '').toLowerCase().trim() === nombre.toLowerCase().trim()
      );
      
      return coincidenciaExacta || null;
    } catch (error) {
      console.error('Error buscando localidad por nombre::', error);
      return null;
    }
  }

  /**
   * Crea una nueva localidad basada en los datos de la ruta
   */
  private async crearNuevaLocalidad(data: LocalidadRutaData): Promise<Localidad> {
    const nuevaLocalidad: LocalidadCreate = {
      nombre: data.nombre,
      departamento: data.departamento || 'NO_ESPECIFICADO',
      provincia: data.provincia || 'NO_ESPECIFICADO',
      distrito: data.distrito || 'NO_ESPECIFICADO',
      municipalidad_centro_poblado: data.nombre,
      nivel_territorial: this.determinarNivelTerritorial(data),
      tipo: this.determinarTipoLocalidad(data),
      descripcion: `Localidad creada desde ruta (${data.tipo})`,
      observaciones: `Creada automáticamente desde empresa ${data.empresaId}, ruta ${data.rutaId}`
    };

    return await this.localidadService.crearLocalidad(nuevaLocalidad);
  }

  /**
   * Determina el nivel territorial basado en los datos disponibles
   */
  private determinarNivelTerritorial(data: LocalidadRutaData): any {
    // Lógica para determinar el nivel territorial
    if (data.distrito && data.distrito !== 'NO_ESPECIFICADO') {
      return 'DISTRITO';
    } else if (data.provincia && data.provincia !== 'NO_ESPECIFICADO') {
      return 'PROVINCIA';
    } else if (data.departamento && data.departamento !== 'NO_ESPECIFICADO') {
      return 'DEPARTAMENTO';
    } else {
      return 'CENTRO_POBLADO';
    }
  }

  /**
   * Determina el tipo de localidad basado en los datos disponibles
   */
  private determinarTipoLocalidad(data: LocalidadRutaData): any {
    // Lógica para determinar el tipo de localidad
    const nombre = data.nombre.toLowerCase();
    
    if (nombre.includes('ciudad') || nombre.includes('capital')) {
      return 'CIUDAD';
    } else if (nombre.includes('distrito')) {
      return 'DISTRITO';
    } else if (nombre.includes('provincia')) {
      return 'PROVINCIA';
    } else if (nombre.includes('departamento')) {
      return 'DEPARTAMENTO';
    } else {
      return 'PUEBLO';
    }
  }

  /**
   * Obtiene estadísticas de localidades creadas desde rutas
   */
  async obtenerEstadisticasLocalidadesRutas(): Promise<any> {
    try {
      return await this.http.get(`${this.apiUrl}/localidades/estadisticas-rutas`).toPromise();
    } catch (error) {
      console.error('Error obteniendo estadísticas::', error);
      return {
        total_localidades: 0,
        creadas_desde_rutas: 0,
        reutilizadas: 0,
        por_empresa: {}
      };
    }
  }

  /**
   * Valida que no haya localidades duplicadas en el sistema
   */
  async validarLocalidadesUnicas(): Promise<any> {
    try {
      return await this.http.get(`${this.apiUrl}/localidades/validar-unicidad`).toPromise();
    } catch (error) {
      console.error('Error validando unicidad::', error);
      return {
        valido: false,
        duplicados: [],
        mensaje: 'Error al validar unicidad'
      };
    }
  }

  /**
   * Consolida localidades duplicadas (fusiona duplicados)
   */
  async consolidarLocalidadesDuplicadas(duplicados: string[]): Promise<any> {
    try {
      return await this.http.post(`${this.apiUrl}/localidades/consolidar-duplicados`, {
        localidades_ids: duplicados
      }).toPromise();
    } catch (error) {
      console.error('Error consolidando duplicados::', error);
      throw error;
    }
  }
}