import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RutaService } from './ruta.service';
import { LocalidadService } from './localidad.service';
import { Localidad, LocalidadCreate, NivelTerritorial } from '../models/localidad.model';
import { Ruta } from '../models/ruta.model';

export interface LocalidadExtraida {
  nombre: string;
  tipo: 'origen' | 'destino' | 'itinerario';
  frecuencia: number;
  rutas: string[]; // IDs de rutas donde aparece
}

export interface ResultadoExtraccion {
  localidadesEncontradas: LocalidadExtraida[];
  totalLocalidades: number;
  localidadesUnicas: string[];
  estadisticas: {
    origenes: number;
    destinos: number;
    itinerarios: number;
    duplicadas: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExtraccionLocalidadesService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private rutaService: RutaService,
    private localidadService: LocalidadService
  ) {}

  /**
   * Extrae todas las localidades de las rutas existentes
   */
  async extraerLocalidadesDeRutas(): Promise<ResultadoExtraccion> {
    try {
      // console.log removed for production
      
      // Obtener todas las rutas
      const rutas = await this.rutaService.getRutas().toPromise() as Ruta[];
      // console.log removed for production

      const localidadesMap = new Map<string, LocalidadExtraida>();

      // Procesar cada ruta
      rutas.forEach(ruta => {
        // Procesar origen
        if (ruta.origen) {
          this.procesarLocalidad(localidadesMap, ruta.origen.nombre, 'origen', ruta.id);
        }

        // Procesar destino
        if (ruta.destino) {
          this.procesarLocalidad(localidadesMap, ruta.destino.nombre, 'destino', ruta.id);
        }

        // Procesar itinerario/descripción
        if (ruta.descripcion) {
          const localidadesItinerario = this.extraerLocalidadesDeItinerario(ruta.descripcion);
          localidadesItinerario.forEach(localidad => {
            this.procesarLocalidad(localidadesMap, localidad, 'itinerario', ruta.id);
          });
        }
      });

      // Convertir Map a array y calcular estadísticas
      const localidadesEncontradas = Array.from(localidadesMap.values());
      const localidadesUnicas = Array.from(localidadesMap.keys());

      const estadisticas = {
        origenes: localidadesEncontradas.filter(l => l.tipo === 'origen').length,
        destinos: localidadesEncontradas.filter(l => l.tipo === 'destino').length,
        itinerarios: localidadesEncontradas.filter(l => l.tipo === 'itinerario').length,
        duplicadas: localidadesEncontradas.filter(l => l.frecuencia > 1).length
      };

      const resultado: ResultadoExtraccion = {
        localidadesEncontradas,
        totalLocalidades: localidadesEncontradas.length,
        localidadesUnicas,
        estadisticas
      };

      // console.log removed for production
      return resultado;

    } catch (error) {
      console.error('❌ Error extrayendo localidades::', error);
      throw error;
    }
  }

  /**
   * Procesa una localidad individual
   */
  private procesarLocalidad(
    map: Map<string, LocalidadExtraida>, 
    nombre: string, 
    tipo: 'origen' | 'destino' | 'itinerario', 
    rutaId: string
  ): void {
    const nombreLimpio = this.limpiarNombreLocalidad(nombre);
    
    if (map.has(nombreLimpio)) {
      const existente = map.get(nombreLimpio)!;
      existente.frecuencia++;
      existente.rutas.push(rutaId);
      
      // Actualizar tipo si es más específico
      if (tipo === 'origen' || tipo === 'destino') {
        existente.tipo = tipo;
      }
    } else {
      map.set(nombreLimpio, {
        nombre: nombreLimpio,
        tipo,
        frecuencia: 1,
        rutas: [rutaId]
      });
    }
  }

  /**
   * Extrae localidades del texto de itinerario
   */
  private extraerLocalidadesDeItinerario(itinerario: string): string[] {
    if (!itinerario) return [];

    // Patrones comunes para separar localidades en itinerarios
    const separadores = ['-', '→', '>', '|', ',', ';', '\n'];
    let localidades: string[] = [];

    // Intentar con diferentes separadores
    for (const sep of separadores) {
      if (itinerario.includes(sep)) {
        localidades = itinerario.split(sep)
          .map(l => l.trim())
          .filter(l => l.length > 0);
        break;
      }
    }

    // Si no se encontraron separadores, tratar como una sola localidad
    if (localidades.length === 0) {
      localidades = [itinerario.trim()];
    }

    return localidades.map(l => this.limpiarNombreLocalidad(l));
  }

  /**
   * Limpia y normaliza el nombre de una localidad
   */
  private limpiarNombreLocalidad(nombre: string): string {
    return nombre
      .trim()
      .toUpperCase()
      .replace(/[^\w\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Crea localidades automáticamente desde las rutas
   */
  async crearLocalidadesDesdeRutas(): Promise<{ creadas: number; errores: string[] }> {
    try {
      // console.log removed for production
      
      const extraccion = await this.extraerLocalidadesDeRutas();
      const localidadesExistentes = await this.localidadService.obtenerLocalidades();
      
      const nombresExistentes = new Set(
        localidadesExistentes.map(l => l.municipalidad_centro_poblado?.toUpperCase() || l.nombre?.toUpperCase() || '')
      );

      const localidadesACrear: LocalidadCreate[] = [];
      const errores: string[] = [];

      // Filtrar localidades que no existen
      extraccion.localidadesEncontradas.forEach(localidadExtraida => {
        if (!nombresExistentes.has(localidadExtraida.nombre)) {
          localidadesACrear.push({
            nombre: localidadExtraida.nombre,
            tipo: 'CENTRO_POBLADO' as any,
            municipalidad_centro_poblado: localidadExtraida.nombre,
            departamento: 'PUNO', // Por defecto, se puede ajustar
            provincia: 'PENDIENTE_CLASIFICAR',
            distrito: 'PENDIENTE_CLASIFICAR',
            nivel_territorial: NivelTerritorial.CENTRO_POBLADO,
            descripcion: `Extraída automáticamente de rutas. Frecuencia: ${localidadExtraida.frecuencia}`,
            observaciones: `Rutas: ${localidadExtraida.rutas.join(', ')}`
          });
        }
      });

      // console.log removed for production

      // Crear localidades en lotes
      const promesasCreacion = localidadesACrear.map(async (localidad, index) => {
        try {
          await this.localidadService.crearLocalidad(localidad);
          // console.log removed for production
        } catch (error) {
          const mensaje = `Error creando ${localidad.municipalidad_centro_poblado}: ${error}`;
          errores.push(mensaje);
          console.error(`❌ ${mensaje}`);
        }
      });

      await Promise.all(promesasCreacion);

      const resultado = {
        creadas: localidadesACrear.length - errores.length,
        errores
      };

      // console.log removed for production
      return resultado;

    } catch (error) {
      console.error('❌ Error en creación automática::', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de uso de localidades en rutas
   */
  async obtenerEstadisticasUso(): Promise<any> {
    try {
      const extraccion = await this.extraerLocalidadesDeRutas();
      
      // Localidades más usadas
      const masUsadas = extraccion.localidadesEncontradas
        .sort((a, b) => b.frecuencia - a.frecuencia)
        .slice(0, 10);

      // Localidades por tipo
      const porTipo = {
        origenes: extraccion.localidadesEncontradas.filter(l => l.tipo === 'origen'),
        destinos: extraccion.localidadesEncontradas.filter(l => l.tipo === 'destino'),
        itinerarios: extraccion.localidadesEncontradas.filter(l => l.tipo === 'itinerario')
      };

      return {
        resumen: extraccion.estadisticas,
        masUsadas,
        porTipo,
        totalUnicas: extraccion.localidadesUnicas.length
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas::', error);
      throw error;
    }
  }

  /**
   * Sincroniza localidades de rutas con la base de datos
   */
  async sincronizarLocalidades(): Promise<any> {
    try {
      // console.log removed for production
      
      const [extraccion, localidadesExistentes] = await Promise.all([
        this.extraerLocalidadesDeRutas(),
        this.localidadService.obtenerLocalidades()
      ]);

      const nombresEnRutas = new Set(extraccion.localidadesUnicas);
      const nombresEnBD = new Set(
        localidadesExistentes.map(l => l.municipalidad_centro_poblado?.toUpperCase() || l.nombre?.toUpperCase() || '')
      );

      // Localidades en rutas pero no en BD
      const faltantesEnBD = Array.from(nombresEnRutas).filter(nombre => 
        !nombresEnBD.has(nombre)
      );

      // Localidades en BD pero no en rutas
      const noUsadasEnRutas = localidadesExistentes.filter(localidad => 
        !nombresEnRutas.has((localidad.municipalidad_centro_poblado || localidad.nombre || '').toUpperCase())
      );

      return {
        localidadesEnRutas: extraccion.totalLocalidades,
        localidadesEnBD: localidadesExistentes.length,
        faltantesEnBD: faltantesEnBD.length,
        noUsadasEnRutas: noUsadasEnRutas.length,
        detalles: {
          faltantesEnBD,
          noUsadasEnRutas: noUsadasEnRutas.map(l => l.municipalidad_centro_poblado)
        }
      };

    } catch (error) {
      console.error('❌ Error en sincronización::', error);
      throw error;
    }
  }
}