import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalidadManagerService, LocalidadRuta, LocalidadProcesada } from './localidad-manager.service';
import { RutaService } from './ruta.service';
import { RutaCreate, Ruta } from '../models/ruta.model';
import { environment } from '../../environments/environment';

export interface RutaConLocalidadesData {
  // Datos básicos de la ruta
  codigoRuta: string;
  nombre: string;
  tipoRuta: string;
  tipoServicio: string;
  empresaId: string;
  resolucionId: string;
  frecuencias?: string;
  descripcion?: string;
  observaciones?: string;
  
  // Localidades
  origen: LocalidadRuta;
  destino: LocalidadRuta;
  itinerario?: LocalidadRuta[];
}

export interface ResultadoProcesamientoRuta {
  exito: boolean;
  rutaId?: string;
  localidadesProcesadas: LocalidadProcesada[];
  errores: string[];
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class RutaProcessorService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private localidadManager: LocalidadManagerService,
    private rutaService: RutaService
  ) {}

  /**
   * Procesa una ruta completa con localidades únicas
   */
  async procesarRutaCompleta(rutaData: RutaConLocalidadesData): Promise<ResultadoProcesamientoRuta> {
    const resultado: ResultadoProcesamientoRuta = {
      exito: false,
      localidadesProcesadas: [],
      errores: [],
      mensaje: ''
    };

    try {
      console.log('🔄 Iniciando procesamiento de ruta:', rutaData.codigoRuta);

      // 1. Validar datos básicos
      const validacion = this.validarDatosRuta(rutaData);
      if (!validacion.valido) {
        resultado.errores = validacion.errores;
        resultado.mensaje = 'Datos de ruta inválidos';
        return resultado;
      }

      // 2. Preparar todas las localidades para procesamiento
      const localidadesParaProcesar: LocalidadRuta[] = [
        { ...rutaData.origen, tipo: 'ORIGEN' },
        { ...rutaData.destino, tipo: 'DESTINO' }
      ];

      // Agregar localidades del itinerario si existen
      if (rutaData.itinerario && rutaData.itinerario.length > 0) {
        rutaData.itinerario.forEach(loc => {
          localidadesParaProcesar.push({ ...loc, tipo: 'ITINERARIO' });
        });
      }

      // 3. Procesar todas las localidades para asegurar unicidad
      console.log('🔄 Procesando localidades únicas...');
      const localidadesProcesadas = await this.localidadManager.procesarLocalidadesRuta(localidadesParaProcesar);
      resultado.localidadesProcesadas = localidadesProcesadas;

      // 4. Extraer IDs de las localidades procesadas
      const origenProcesado = localidadesProcesadas.find(loc => loc.tipo === 'ORIGEN');
      const destinoProcesado = localidadesProcesadas.find(loc => loc.tipo === 'DESTINO');
      const itinerarioProcesado = localidadesProcesadas.filter(loc => loc.tipo === 'ITINERARIO');

      if (!origenProcesado || !destinoProcesado) {
        resultado.errores.push('No se pudieron procesar las localidades de origen y destino');
        resultado.mensaje = 'Error procesando localidades principales';
        return resultado;
      }

      // 5. Crear la estructura de ruta para el backend
      const rutaParaCrear: RutaCreate = {
        codigoRuta: rutaData.codigoRuta,
        nombre: rutaData.nombre,
        origenId: origenProcesado.id,
        destinoId: destinoProcesado.id,
        itinerarioIds: itinerarioProcesado.map(loc => loc.id),
        frecuencias: rutaData.frecuencias || '',
        tipoRuta: rutaData.tipoRuta as any,
        tipoServicio: rutaData.tipoServicio as any,
        empresaId: rutaData.empresaId,
        resolucionId: rutaData.resolucionId,
        descripcion: rutaData.descripcion,
        observaciones: rutaData.observaciones
      };

      // 6. Crear la ruta en el backend
      console.log('🔄 Creando ruta en el backend...');
      const rutaCreada = await this.rutaService.createRuta(rutaParaCrear).toPromise();

      if (!rutaCreada) {
        resultado.errores.push('No se pudo crear la ruta en el backend');
        resultado.mensaje = 'Error creando ruta';
        return resultado;
      }

      // 7. Resultado exitoso
      resultado.exito = true;
      resultado.rutaId = rutaCreada.id;
      resultado.mensaje = `Ruta "${rutaData.nombre}" creada exitosamente con ${localidadesProcesadas.length} localidades procesadas`;

      console.log('✅ Ruta procesada exitosamente:', resultado);
      return resultado;

    } catch (error: any) {
      console.error('❌ Error procesando ruta completa:', error);
      resultado.errores.push(`Error general: ${error.message || error}`);
      resultado.mensaje = 'Error inesperado durante el procesamiento';
      return resultado;
    }
  }

  /**
   * Procesa múltiples rutas en lote
   */
  async procesarRutasEnLote(rutas: RutaConLocalidadesData[]): Promise<ResultadoProcesamientoRuta[]> {
    console.log(`🔄 Procesando ${rutas.length} rutas en lote`);
    
    const resultados: ResultadoProcesamientoRuta[] = [];
    
    for (let i = 0; i < rutas.length; i++) {
      const ruta = rutas[i];
      console.log(`🔄 Procesando ruta ${i + 1}/${rutas.length}: ${ruta.nombre || ruta.codigoRuta}`);
      
      try {
        const resultado = await this.procesarRutaCompleta(ruta);
        resultados.push(resultado);
        
        // Pequeña pausa para no sobrecargar el servidor
        if (i < rutas.length - 1) {
          await this.delay(200);
        }
      } catch (error) {
        console.error(`❌ Error procesando ruta ${i + 1}:`, error);
        resultados.push({
          exito: false,
          localidadesProcesadas: [],
          errores: [`Error procesando ruta: ${error}`],
          mensaje: 'Error inesperado'
        });
      }
    }
    
    return resultados;
  }

  /**
   * Genera un resumen del procesamiento
   */
  generarResumenProcesamiento(resultados: ResultadoProcesamientoRuta[]): any {
    const resumen = {
      total_rutas_procesadas: resultados.length,
      rutas_exitosas: 0,
      rutas_con_errores: 0,
      total_localidades_procesadas: 0,
      localidades_nuevas: 0,
      localidades_reutilizadas: 0,
      errores_comunes: [] as string[]
    };

    resultados.forEach(resultado => {
      if (resultado.exito) {
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
      });
    });

    return resumen;
  }

  /**
   * Valida los datos de una ruta antes del procesamiento
   */
  private validarDatosRuta(rutaData: RutaConLocalidadesData): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar datos básicos
    if (!rutaData.codigoRuta || rutaData.codigoRuta.trim() === '') {
      errores.push('El código de ruta es requerido');
    }

    if (!rutaData.nombre || rutaData.nombre.trim() === '') {
      errores.push('El nombre de ruta es requerido');
    }

    if (!rutaData.empresaId || rutaData.empresaId.trim() === '') {
      errores.push('El ID de empresa es requerido');
    }

    if (!rutaData.resolucionId || rutaData.resolucionId.trim() === '') {
      errores.push('El ID de resolución es requerido');
    }

    // Validar localidades
    if (!rutaData.origen || !rutaData.origen.nombre || rutaData.origen.nombre.trim() === '') {
      errores.push('La localidad de origen es requerida');
    }

    if (!rutaData.destino || !rutaData.destino.nombre || rutaData.destino.nombre.trim() === '') {
      errores.push('La localidad de destino es requerida');
    }

    // Validar que origen y destino no sean iguales
    if (rutaData.origen?.nombre && rutaData.destino?.nombre && 
        rutaData.origen.nombre.toLowerCase().trim() === rutaData.destino.nombre.toLowerCase().trim()) {
      errores.push('La localidad de origen y destino no pueden ser iguales');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Utilidad para crear una pausa
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene estadísticas del procesamiento de rutas
   */
  async obtenerEstadisticasProcesamiento(): Promise<any> {
    try {
      const estadisticasLocalidades = await this.localidadManager.obtenerEstadisticas();
      
      return {
        localidades: estadisticasLocalidades,
        mensaje: 'Estadísticas obtenidas correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        localidades: {
          total_localidades: 0,
          por_departamento: {},
          por_provincia: {},
          por_tipo: {},
          activas: 0,
          inactivas: 0
        },
        mensaje: 'Error obteniendo estadísticas'
      };
    }
  }
}