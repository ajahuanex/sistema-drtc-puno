import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { LocalidadService } from './localidad.service';
import { Localidad, LocalidadUpdate } from '../models/localidad.model';
import { environment } from '../../environments/environment';

/**
 * Servicio para generar IDs únicos para localidades y corregir vinculaciones en rutas
 */
@Injectable({
  providedIn: 'root'
})
export class LocalidadIdGeneratorService {
  private http = inject(HttpClient);
  private localidadService = inject(LocalidadService);
  private apiUrl = environment.apiUrl;

  /**
   * Generar ID único para una localidad basado en su información
   */
  generarIdLocalidad(localidad: Partial<Localidad>): string {
    // Generar ID basado en departamento, provincia, distrito y centro poblado
    const partes = [
      localidad.departamento?.replace(/\s+/g, '').toUpperCase(),
      localidad.provincia?.replace(/\s+/g, '').toUpperCase(),
      localidad.distrito?.replace(/\s+/g, '').toUpperCase(),
      localidad.municipalidad_centro_poblado?.replace(/\s+/g, '').toUpperCase()
    ].filter(Boolean);

    // Crear ID único
    const baseId = partes.join('_');
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    
    return `LOC_${baseId}_${timestamp}`;
  }

  /**
   * Procesar todas las localidades para asegurar IDs únicos
   */
  async procesarLocalidadesParaIds(): Promise<{
    procesadas: number;
    actualizadas: number;
    errores: string[];
  }> {
    console.log('🔄 Iniciando procesamiento de localidades para generar IDs únicos...');
    
    try {
      // Obtener todas las localidades
      const localidades = await this.localidadService.getLocalidades().toPromise() as Localidad[];
      console.log(`📊 Total localidades encontradas: ${localidades.length}`);
      
      const resultado = {
        procesadas: 0,
        actualizadas: 0,
        errores: [] as string[]
      };

      // Procesar cada localidad
      for (const localidad of localidades) {
        try {
          resultado.procesadas++;
          
          // Si la localidad no tiene ID o tiene un ID genérico, generar uno nuevo
          if (!localidad.id || localidad.id.startsWith('temp_') || localidad.id.length < 10) {
            const nuevoId = this.generarIdLocalidad(localidad);
            
            const actualizacion: LocalidadUpdate = {
              ubigeo: localidad.ubigeo,
              ubigeo_identificador_mcp: nuevoId, // Usar este campo para el nuevo ID
              departamento: localidad.departamento,
              provincia: localidad.provincia,
              distrito: localidad.distrito,
              municipalidad_centro_poblado: localidad.municipalidad_centro_poblado,
              nivel_territorial: localidad.nivel_territorial,
              dispositivo_legal_creacion: localidad.dispositivo_legal_creacion,
              coordenadas: localidad.coordenadas,
              nombre: localidad.nombre,
              codigo: localidad.codigo,
              tipo: localidad.tipo,
              descripcion: localidad.descripcion,
              observaciones: `ID actualizado: ${nuevoId}`,
              esta_activa: localidad.esta_activa
            };
            
            await this.localidadService.actualizarLocalidad(localidad.id, actualizacion);
            console.log(`✅ Localidad actualizada: ${localidad.municipalidad_centro_poblado} -> ID: ${nuevoId}`);
            resultado.actualizadas++;
          }
          
        } catch (error: any) {
          const errorMsg = `Error procesando localidad ${localidad.municipalidad_centro_poblado}: ${error.message}`;
          console.error('❌', errorMsg);
          resultado.errores.push(errorMsg);
        }
      }

      console.log('✅ Procesamiento de localidades completado:', resultado);
      return resultado;
      
    } catch (error: any) {
      console.error('❌ Error general en procesamiento de localidades:', error);
      throw error;
    }
  }

  /**
   * Crear mapa de localidades por nombre para vinculación con rutas
   */
  async crearMapaLocalidades(): Promise<Map<string, string>> {
    console.log('🗺️ Creando mapa de localidades...');
    
    const localidades = await this.localidadService.getLocalidades().toPromise() as Localidad[];
    const mapa = new Map<string, string>();
    
    localidades.forEach(localidad => {
      // Crear múltiples claves para facilitar la búsqueda
      const claves = [
        localidad.municipalidad_centro_poblado.toUpperCase(),
        localidad.distrito.toUpperCase(),
        localidad.provincia.toUpperCase(),
        `${localidad.distrito.toUpperCase()}_${localidad.provincia.toUpperCase()}`,
        `${localidad.municipalidad_centro_poblado.toUpperCase()}_${localidad.distrito.toUpperCase()}`
      ];
      
      claves.forEach(clave => {
        if (!mapa.has(clave)) {
          mapa.set(clave, localidad.id);
        }
      });
    });
    
    console.log(`✅ Mapa de localidades creado con ${mapa.size} entradas`);
    return mapa;
  }

  /**
   * Actualizar rutas para vincular correctamente con localidades
   */
  async actualizarVinculacionRutas(): Promise<{
    procesadas: number;
    actualizadas: number;
    errores: string[];
  }> {
    console.log('🔄 Iniciando actualización de vinculación de rutas...');
    
    try {
      // Obtener mapa de localidades
      const mapaLocalidades = await this.crearMapaLocalidades();
      
      // Obtener todas las rutas
      const response = await this.http.get<any[]>(`${this.apiUrl}/rutas`).toPromise();
      const rutas = response || [];
      console.log(`📊 Total rutas encontradas: ${rutas.length}`);
      
      const resultado = {
        procesadas: 0,
        actualizadas: 0,
        errores: [] as string[]
      };

      // Procesar cada ruta
      for (const ruta of rutas) {
        try {
          resultado.procesadas++;
          let necesitaActualizacion = false;
          const actualizacion: any = {};

          // Buscar origenId si no existe
          if (!ruta.origenId && ruta.origen) {
            const origenId = this.buscarLocalidadId(ruta.origen, mapaLocalidades);
            if (origenId) {
              actualizacion.origenId = origenId;
              necesitaActualizacion = true;
              console.log(`🎯 Origen encontrado: ${ruta.origen} -> ${origenId}`);
            }
          }

          // Buscar destinoId si no existe
          if (!ruta.destinoId && ruta.destino) {
            const destinoId = this.buscarLocalidadId(ruta.destino, mapaLocalidades);
            if (destinoId) {
              actualizacion.destinoId = destinoId;
              necesitaActualizacion = true;
              console.log(`🎯 Destino encontrado: ${ruta.destino} -> ${destinoId}`);
            }
          }

          // Procesar itinerario si está vacío
          if ((!ruta.itinerarioIds || ruta.itinerarioIds.length === 0) && ruta.descripcion) {
            const itinerarioIds = this.extraerItinerarioIds(ruta.descripcion, mapaLocalidades);
            if (itinerarioIds.length > 0) {
              actualizacion.itinerarioIds = itinerarioIds;
              necesitaActualizacion = true;
              console.log(`🛣️ Itinerario procesado: ${itinerarioIds.length} localidades`);
            }
          }

          // Actualizar ruta si es necesario
          if (necesitaActualizacion) {
            await this.http.put(`${this.apiUrl}/rutas/${ruta.id}`, actualizacion).toPromise();
            console.log(`✅ Ruta actualizada: ${ruta.codigoRuta}`);
            resultado.actualizadas++;
          }
          
        } catch (error: any) {
          const errorMsg = `Error procesando ruta ${ruta.codigoRuta}: ${error.message}`;
          console.error('❌', errorMsg);
          resultado.errores.push(errorMsg);
        }
      }

      console.log('✅ Actualización de rutas completada:', resultado);
      return resultado;
      
    } catch (error: any) {
      console.error('❌ Error general en actualización de rutas:', error);
      throw error;
    }
  }

  /**
   * Buscar ID de localidad por nombre
   */
  private buscarLocalidadId(nombre: string, mapa: Map<string, string>): string | null {
    const nombreLimpio = nombre.toUpperCase().trim();
    
    // Buscar coincidencia exacta
    if (mapa.has(nombreLimpio)) {
      return mapa.get(nombreLimpio)!;
    }
    
    // Buscar coincidencia parcial
    for (const [clave, id] of mapa.entries()) {
      if (clave.includes(nombreLimpio) || nombreLimpio.includes(clave)) {
        return id;
      }
    }
    
    return null;
  }

  /**
   * Extraer IDs de itinerario desde la descripción de la ruta
   */
  private extraerItinerarioIds(descripcion: string, mapa: Map<string, string>): string[] {
    const itinerarioIds: string[] = [];
    
    // Dividir la descripción por separadores comunes
    const separadores = ['-', '→', '>', ',', ';', '|'];
    let localidades = [descripcion];
    
    separadores.forEach(sep => {
      localidades = localidades.flatMap(loc => loc.split(sep));
    });
    
    // Limpiar y buscar cada localidad
    localidades.forEach(localidad => {
      const nombreLimpio = localidad.trim();
      if (nombreLimpio.length > 2) {
        const id = this.buscarLocalidadId(nombreLimpio, mapa);
        if (id && !itinerarioIds.includes(id)) {
          itinerarioIds.push(id);
        }
      }
    });
    
    return itinerarioIds;
  }

  /**
   * Ejecutar proceso completo de corrección
   */
  async ejecutarCorreccionCompleta(): Promise<{
    localidades: { procesadas: number; actualizadas: number; errores: string[] };
    rutas: { procesadas: number; actualizadas: number; errores: string[] };
  }> {
    console.log('🚀 Iniciando corrección completa del sistema de localidades y rutas...');
    
    try {
      // Paso 1: Procesar localidades para generar IDs únicos
      console.log('📍 Paso 1: Procesando localidades...');
      const resultadoLocalidades = await this.procesarLocalidadesParaIds();
      
      // Paso 2: Actualizar vinculación de rutas
      console.log('🛣️ Paso 2: Actualizando vinculación de rutas...');
      const resultadoRutas = await this.actualizarVinculacionRutas();
      
      const resultado = {
        localidades: resultadoLocalidades,
        rutas: resultadoRutas
      };
      
      console.log('🎉 Corrección completa finalizada:', resultado);
      return resultado;
      
    } catch (error: any) {
      console.error('❌ Error en corrección completa:', error);
      throw error;
    }
  }
}