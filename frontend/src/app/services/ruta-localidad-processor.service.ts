import { Injectable } from '@angular/core';
import { LocalidadUnicaService, LocalidadRutaData, ResultadoProcesamiento } from './localidad-unica.service';
import { RutaService } from './ruta.service';
import { Ruta, RutaCreate, RutaUpdate } from '../models/ruta.model';

export interface RutaConLocalidades {
  ruta: RutaCreate | RutaUpdate;
  origen: LocalidadRutaData;
  destino: LocalidadRutaData;
  itinerario?: LocalidadRutaData[];
}

export interface ResultadoProcesamientoRuta {
  rutaId?: string;
  origenId: string;
  destinoId: string;
  itinerarioIds: string[];
  localidadesProcesadas: ResultadoProcesamiento[];
  esExitoso: boolean;
  errores: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RutaLocalidadProcessorService {

  constructor(
    private localidadUnicaService: LocalidadUnicaService,
    private rutaService: RutaService
  ) {}

  /**
   * Procesa una ruta completa, asegurando que todas las localidades sean únicas
   */
  async procesarRutaCompleta(rutaData: RutaConLocalidades): Promise<ResultadoProcesamientoRuta> {
    const resultado: ResultadoProcesamientoRuta = {
      origenId: '',
      destinoId: '',
      itinerarioIds: [],
      localidadesProcesadas: [],
      esExitoso: false,
      errores: []
    };

    try {
      // 1. Procesar localidad de origen
      // console.log removed for production
      const origenResult = await this.localidadUnicaService.procesarLocalidadDesdeRuta(rutaData.origen);
      resultado.origenId = origenResult.localidadId;
      resultado.localidadesProcesadas.push(origenResult);

      // 2. Procesar localidad de destino
      // console.log removed for production
      const destinoResult = await this.localidadUnicaService.procesarLocalidadDesdeRuta(rutaData.destino);
      resultado.destinoId = destinoResult.localidadId;
      resultado.localidadesProcesadas.push(destinoResult);

      // 3. Procesar localidades del itinerario (si existen)
      if (rutaData.itinerario && rutaData.itinerario.length > 0) {
        // console.log removed for production
        
        for (const localidadItinerario of rutaData.itinerario) {
          try {
            const itinerarioResult = await this.localidadUnicaService.procesarLocalidadDesdeRuta(localidadItinerario);
            resultado.itinerarioIds.push(itinerarioResult.localidadId);
            resultado.localidadesProcesadas.push(itinerarioResult);
          } catch (error) {
            console.error(`❌ Error procesando localidad del itinerario "${localidadItinerario.nombre}":`, error);
            resultado.errores.push(`Error procesando localidad del itinerario: ${localidadItinerario.nombre}`);
          }
        }
      }

      // 4. Actualizar la ruta con los objetos de localidades procesadas
      rutaData.ruta.origen = {
        id: resultado.origenId,
        nombre: resultado.localidadesProcesadas.find((l: any) => l.id === resultado.origenId)?.nombre || ''
      };
      rutaData.ruta.destino = {
        id: resultado.destinoId,
        nombre: resultado.localidadesProcesadas.find((l: any) => l.id === resultado.destinoId)?.nombre || ''
      };
      rutaData.ruta.itinerario = resultado.itinerarioIds.map((id, index) => ({
        id,
        nombre: resultado.localidadesProcesadas.find((l: any) => l.id === id)?.nombre || '',
        orden: index + 1
      }));

      // 5. Crear o actualizar la ruta
      if ('id' in rutaData.ruta && rutaData.ruta.id) {
        // Actualizar ruta existente
        // console.log removed for production
        const rutaActualizada = await this.rutaService.updateRuta(
          rutaData.ruta.id as string, 
          rutaData.ruta as RutaUpdate
        ).toPromise();
        resultado.rutaId = rutaActualizada?.id;
      } else {
        // Crear nueva ruta
        // console.log removed for production
        const rutaCreada = await this.rutaService.createRuta(rutaData.ruta as RutaCreate).toPromise();
        resultado.rutaId = rutaCreada?.id;
      }

      resultado.esExitoso = true;
      // console.log removed for production

    } catch (error) {
      console.error('❌ Error procesando ruta completa::', error);
      resultado.errores.push(`Error general: ${error}`);
      resultado.esExitoso = false;
    }

    return resultado;
  }

  /**
   * Procesa múltiples rutas en lote
   */
  async procesarRutasEnLote(rutas: RutaConLocalidades[]): Promise<ResultadoProcesamientoRuta[]> {
    const resultados: ResultadoProcesamientoRuta[] = [];
    
    // console.log removed for production
    
    for (let i = 0; i < rutas.length; i++) {
      const ruta = rutas[i];
      // console.log removed for production
      
      try {
        const resultado = await this.procesarRutaCompleta(ruta);
        resultados.push(resultado);
        
        // Pequeña pausa para no sobrecargar el servidor
        if (i < rutas.length - 1) {
          await this.delay(100);
        }
      } catch (error) {
        console.error(`❌ Error procesando ruta ${i + 1}:`, error);
        resultados.push({
          rutaId: undefined,
          origenId: '',
          destinoId: '',
          itinerarioIds: [],
          localidadesProcesadas: [],
          esExitoso: false,
          errores: [`Error procesando ruta: ${error}`]
        });
      }
    }
    
    return resultados;
  }

  /**
   * Valida que una ruta tenga localidades válidas antes de procesarla
   */
  validarRutaAntesDeProcesamientos(rutaData: RutaConLocalidades): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar origen
    if (!rutaData.origen || !rutaData.origen.nombre || rutaData.origen.nombre.trim() === '') {
      errores.push('La localidad de origen es requerida');
    }

    // Validar destino
    if (!rutaData.destino || !rutaData.destino.nombre || rutaData.destino.nombre.trim() === '') {
      errores.push('La localidad de destino es requerida');
    }

    // Validar que origen y destino no sean iguales
    if (rutaData.origen?.nombre && rutaData.destino?.nombre && 
        rutaData.origen.nombre.toLowerCase().trim() === rutaData.destino.nombre.toLowerCase().trim()) {
      errores.push('La localidad de origen y destino no pueden ser iguales');
    }

    // Validar empresa ID
    if (!rutaData.origen?.empresaId || !rutaData.destino?.empresaId) {
      errores.push('El ID de empresa es requerido');
    }

    // Validar datos de la ruta
    if (!rutaData.ruta.codigoRuta || rutaData.ruta.codigoRuta.trim() === '') {
      errores.push('El código de ruta es requerido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Obtiene un resumen del procesamiento de localidades
   */
  generarResumenProcesamiento(resultados: ResultadoProcesamientoRuta[]): any {
    const resumen = {
      total_rutas_procesadas: resultados.length,
      rutas_exitosas: 0,
      rutas_con_errores: 0,
      total_localidades_procesadas: 0,
      localidades_nuevas: 0,
      localidades_reutilizadas: 0,
      errores_comunes: [] as string[],
      localidades_por_empresa: {} as { [key: string]: number }
    };

    resultados.forEach(resultado => {
      if (resultado.esExitoso) {
        resumen.rutas_exitosas++;
      } else {
        resumen.rutas_con_errores++;
        resumen.errores_comunes.push(...resultado.errores);
      }

      resumen.total_localidades_procesadas += resultado.localidadesProcesadas.length;
      
      resultado.localidadesProcesadas.forEach(localidad => {
        if (localidad.esNueva) {
          resumen.localidades_nuevas++;
        } else {
          resumen.localidades_reutilizadas++;
        }

        // Contar por empresa
        if (!resumen.localidades_por_empresa[localidad.empresaOrigen]) {
          resumen.localidades_por_empresa[localidad.empresaOrigen] = 0;
        }
        resumen.localidades_por_empresa[localidad.empresaOrigen]++;
      });
    });

    return resumen;
  }

  /**
   * Utilidad para crear una pausa
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}