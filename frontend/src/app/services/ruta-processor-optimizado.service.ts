import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalidadManagerService, LocalidadProcesada } from './localidad-manager.service';
import { RutaService } from './ruta.service';
import { RutaCreate, LocalidadEmbebida, EmpresaEmbebida } from '../models/ruta.model';
import { environment } from '../../environments/environment';

export interface RutaOptimizadaData {
  // Datos básicos de la ruta
  codigoRuta: string;
  nombre: string;
  tipoRuta: string;
  tipoServicio: string;
  frecuencias?: string;
  descripcion?: string;
  observaciones?: string;
  resolucionId?: string;
  
  // ESTRUCTURA OPTIMIZADA - Objetos completos (sin necesidad de consultas adicionales)
  origen: {
    nombre: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
  };
  destino: {
    nombre: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
  };
  itinerario?: Array<{
    nombre: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
  }>;
  empresa: {
    id: string;
    ruc: string;
    razonSocial: string;
  };
}

export interface ResultadoProcesamientoOptimizado {
  exito: boolean;
  rutaId?: string;
  localidadesProcesadas: LocalidadProcesada[];
  errores: string[];
  mensaje: string;
  tiempoProcessamiento?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RutaProcessorOptimizadoService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private localidadManager: LocalidadManagerService,
    private rutaService: RutaService
  ) {}

  /**
   * Procesa una ruta con la nueva estructura optimizada (SIN consultas adicionales)
   */
  async procesarRutaOptimizada(rutaData: RutaOptimizadaData): Promise<ResultadoProcesamientoOptimizado> {
    const inicioTiempo = Date.now();
    const resultado: ResultadoProcesamientoOptimizado = {
      exito: false,
      localidadesProcesadas: [],
      errores: [],
      mensaje: ''
    };

    try {
      console.log('🚀 Procesando ruta OPTIMIZADA:', rutaData.codigoRuta);

      // 1. Validar datos básicos
      const validacion = this.validarDatosRuta(rutaData);
      if (!validacion.valido) {
        resultado.errores = validacion.errores;
        resultado.mensaje = 'Datos de ruta inválidos';
        return resultado;
      }

      // 2. Procesar SOLO las localidades únicas (sin consultas a empresas)
      const localidadesParaProcesar = [
        { ...rutaData.origen, tipo: 'ORIGEN' as const },
        { ...rutaData.destino, tipo: 'DESTINO' as const }
      ];

      // Agregar itinerario si existe
      if (rutaData.itinerario && rutaData.itinerario.length > 0) {
        rutaData.itinerario.forEach(loc => {
          localidadesParaProcesar.push({ ...loc, tipo: 'ITINERARIO' as const });
        });
      }

      console.log('🔄 Procesando localidades únicas...');
      const localidadesProcesadas = await this.localidadManager.procesarLocalidadesRuta(localidadesParaProcesar);
      resultado.localidadesProcesadas = localidadesProcesadas;

      // 3. Extraer localidades procesadas por tipo
      const origenProcesado = localidadesProcesadas.find(loc => loc.tipo === 'ORIGEN');
      const destinoProcesado = localidadesProcesadas.find(loc => loc.tipo === 'DESTINO');
      const itinerarioProcesado = localidadesProcesadas.filter(loc => loc.tipo === 'ITINERARIO');

      if (!origenProcesado || !destinoProcesado) {
        resultado.errores.push('No se pudieron procesar las localidades principales');
        resultado.mensaje = 'Error procesando localidades de origen y destino';
        return resultado;
      }

      // 4. Crear estructura de ruta OPTIMIZADA (con objetos embebidos)
      const rutaOptimizada: RutaCreate = {
        codigoRuta: rutaData.codigoRuta,
        nombre: rutaData.nombre,
        
        // OBJETOS EMBEBIDOS - Sin necesidad de consultas adicionales
        origen: {
          id: origenProcesado.id,
          nombre: origenProcesado.nombre,
          departamento: rutaData.origen.departamento,
          provincia: rutaData.origen.provincia,
          distrito: rutaData.origen.distrito
        },
        destino: {
          id: destinoProcesado.id,
          nombre: destinoProcesado.nombre,
          departamento: rutaData.destino.departamento,
          provincia: rutaData.destino.provincia,
          distrito: rutaData.destino.distrito
        },
        itinerario: itinerarioProcesado.map((loc, index) => ({
          id: loc.id,
          nombre: loc.nombre,
          departamento: rutaData.itinerario?.[index]?.departamento,
          provincia: rutaData.itinerario?.[index]?.provincia,
          distrito: rutaData.itinerario?.[index]?.distrito
        })),
        empresa: {
          id: rutaData.empresa.id,
          ruc: rutaData.empresa.ruc,
          razonSocial: rutaData.empresa.razonSocial
        },
        
        // Resto de campos
        frecuencias: rutaData.frecuencias || '',
        tipoRuta: rutaData.tipoRuta as any,
        tipoServicio: rutaData.tipoServicio as any,
        descripcion: rutaData.descripcion,
        observaciones: rutaData.observaciones,
        resolucionId: rutaData.resolucionId
      };

      // 5. Crear ruta en el backend (UNA SOLA LLAMADA)
      console.log('🔄 Creando ruta optimizada en backend...');
      const rutaCreada = await this.rutaService.createRuta(rutaOptimizada).toPromise();

      if (!rutaCreada) {
        resultado.errores.push('Error creando ruta en el backend');
        resultado.mensaje = 'Fallo en la creación de la ruta';
        return resultado;
      }

      // 6. Resultado exitoso
      const tiempoTotal = Date.now() - inicioTiempo;
      resultado.exito = true;
      resultado.rutaId = rutaCreada.id;
      resultado.tiempoProcessamiento = tiempoTotal;
      resultado.mensaje = `Ruta "${rutaData.nombre}" creada en ${tiempoTotal}ms con estructura optimizada`;

      console.log('✅ Ruta optimizada procesada exitosamente:', {
        rutaId: resultado.rutaId,
        tiempo: tiempoTotal + 'ms',
        localidades: localidadesProcesadas.length
      });

      return resultado;

    } catch (error: any) {
      const tiempoTotal = Date.now() - inicioTiempo;
      console.error('❌ Error procesando ruta optimizada:', error);
      resultado.errores.push(`Error: ${error.message || error}`);
      resultado.mensaje = 'Error inesperado en el procesamiento optimizado';
      resultado.tiempoProcessamiento = tiempoTotal;
      return resultado;
    }
  }

  /**
   * Procesa múltiples rutas en lote con estructura optimizada
   */
  async procesarRutasEnLoteOptimizado(rutas: RutaOptimizadaData[]): Promise<ResultadoProcesamientoOptimizado[]> {
    console.log(`🚀 Procesando ${rutas.length} rutas en lote OPTIMIZADO`);
    
    const resultados: ResultadoProcesamientoOptimizado[] = [];
    const inicioTotal = Date.now();
    
    for (let i = 0; i < rutas.length; i++) {
      const ruta = rutas[i];
      console.log(`🔄 Procesando ruta ${i + 1}/${rutas.length}: ${ruta.nombre || ruta.codigoRuta}`);
      
      try {
        const resultado = await this.procesarRutaOptimizada(ruta);
        resultados.push(resultado);
        
        // Pausa mínima para no sobrecargar
        if (i < rutas.length - 1) {
          await this.delay(50); // Reducido de 200ms a 50ms
        }
      } catch (error) {
        console.error(`❌ Error procesando ruta ${i + 1}:`, error);
        resultados.push({
          exito: false,
          localidadesProcesadas: [],
          errores: [`Error procesando ruta: ${error}`],
          mensaje: 'Error inesperado',
          tiempoProcessamiento: 0
        });
      }
    }
    
    const tiempoTotal = Date.now() - inicioTotal;
    console.log(`✅ Lote completado en ${tiempoTotal}ms - ${resultados.filter(r => r.exito).length}/${rutas.length} exitosas`);
    
    return resultados;
  }

  /**
   * Valida los datos de una ruta antes del procesamiento
   */
  private validarDatosRuta(rutaData: RutaOptimizadaData): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar datos básicos
    if (!rutaData.codigoRuta?.trim()) {
      errores.push('El código de ruta es requerido');
    }

    if (!rutaData.nombre?.trim()) {
      errores.push('El nombre de ruta es requerido');
    }

    // Validar empresa
    if (!rutaData.empresa?.id?.trim()) {
      errores.push('El ID de empresa es requerido');
    }

    if (!rutaData.empresa?.ruc?.trim()) {
      errores.push('El RUC de empresa es requerido');
    }

    if (!rutaData.empresa?.razonSocial?.trim()) {
      errores.push('La razón social de empresa es requerida');
    }

    // Validar localidades
    if (!rutaData.origen?.nombre?.trim()) {
      errores.push('La localidad de origen es requerida');
    }

    if (!rutaData.destino?.nombre?.trim()) {
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
   * Genera resumen del procesamiento optimizado
   */
  generarResumenOptimizado(resultados: ResultadoProcesamientoOptimizado[]): any {
    const resumen = {
      total_rutas_procesadas: resultados.length,
      rutas_exitosas: 0,
      rutas_con_errores: 0,
      tiempo_total_procesamiento: 0,
      tiempo_promedio_por_ruta: 0,
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

      resumen.tiempo_total_procesamiento += resultado.tiempoProcessamiento || 0;
      resumen.total_localidades_procesadas += resultado.localidadesProcesadas.length;
      
      resultado.localidadesProcesadas.forEach(localidad => {
        if (localidad.esNueva) {
          resumen.localidades_nuevas++;
        } else {
          resumen.localidades_reutilizadas++;
        }
      });
    });

    resumen.tiempo_promedio_por_ruta = resultados.length > 0 
      ? Math.round(resumen.tiempo_total_procesamiento / resultados.length) 
      : 0;

    return resumen;
  }

  /**
   * Utilidad para crear una pausa
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}