import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalidadService } from './localidad.service';

interface SeederResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    creadas: number;
    actualizadas: number;
    errores: number;
  };
  errores?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LocalidadesSeederService {
  private http = inject(HttpClient);
  private localidadService = inject(LocalidadService);

  /**
   * Inicializar MongoDB con localidades básicas del sistema
   */
  async inicializarBaseDatos(): Promise<SeederResult> {
    console.log('🌱 Iniciando proceso de inicialización de localidades básicas...');
    
    const resultado: SeederResult = {
      success: false,
      message: '',
      stats: {
        total: 0,
        creadas: 0,
        actualizadas: 0,
        errores: 0
      },
      errores: []
    };

    try {
      // Llamar al endpoint de inicialización del backend
      console.log('🚀 Llamando al endpoint de inicialización...');
      const respuesta = await this.localidadService.inicializarLocalidadesDefault();
      
      if (respuesta && respuesta.localidades_creadas !== undefined) {
        resultado.stats.creadas = respuesta.localidades_creadas;
        resultado.stats.total = respuesta.localidades_creadas;
        resultado.success = true;
        resultado.message = respuesta.message || 'Localidades inicializadas exitosamente';
        
        console.log(`✅ ${resultado.stats.creadas} localidades inicializadas exitosamente`);
      } else {
        resultado.success = true;
        resultado.message = 'Las localidades ya estaban inicializadas';
        console.log('ℹ️ Las localidades ya estaban inicializadas');
      }

    } catch (error: any) {
      console.error('❌ Error inicializando localidades:', error);
      resultado.success = false;
      resultado.message = `Error: ${error?.message || 'Error desconocido'}`;
      resultado.stats.errores = 1;
      resultado.errores = [error?.message || 'Error desconocido'];
    }

    return resultado;
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async obtenerEstadisticasBaseDatos(): Promise<any> {
    try {
      const localidades = await this.localidadService.obtenerLocalidades();
      
      const stats = {
        total: localidades.length,
        activas: localidades.filter(l => l.esta_activa).length,
        inactivas: localidades.filter(l => !l.esta_activa).length,
        provincias: new Set(localidades.map(l => l.provincia).filter(p => p)).size,
        distritos: new Set(localidades.map(l => l.distrito).filter(d => d)).size,
        centrosPoblados: localidades.filter(l => l.tipo === 'CENTRO_POBLADO').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total: 0,
        activas: 0,
        inactivas: 0,
        provincias: 0,
        distritos: 0,
        centrosPoblados: 0
      };
    }
  }

  /**
   * Exportar datos de MongoDB
   */
  async exportarDatosMongoDB(): Promise<string> {
    try {
      const localidades = await this.localidadService.obtenerLocalidades();
      const datos = {
        exportado: new Date().toISOString(),
        total: localidades.length,
        localidades: localidades
      };
      
      return JSON.stringify(datos, null, 2);
    } catch (error) {
      console.error('Error exportando datos:', error);
      throw error;
    }
  }

  /**
   * Reinicializar base de datos (limpiar y volver a inicializar)
   */
  async reinicializarBaseDatos(): Promise<SeederResult> {
    console.log('🔄 Reinicializando base de datos...');
    
    try {
      // Primero limpiar
      await this.limpiarBaseDatos();
      
      // Luego inicializar
      return await this.inicializarBaseDatos();
    } catch (error: any) {
      console.error('Error reinicializando:', error);
      return {
        success: false,
        message: `Error reinicializando: ${error?.message || 'Error desconocido'}`,
        stats: { total: 0, creadas: 0, actualizadas: 0, errores: 1 },
        errores: [error?.message || 'Error desconocido']
      };
    }
  }

  /**
   * Limpiar base de datos
   */
  async limpiarBaseDatos(): Promise<boolean> {
    try {
      console.log('🧹 Limpiando base de datos...');
      
      // Obtener todas las localidades y eliminarlas una por una
      const localidades = await this.localidadService.obtenerLocalidades();
      
      for (const localidad of localidades) {
        try {
          await this.localidadService.eliminarLocalidad(localidad.id);
        } catch (error) {
          console.warn(`Advertencia eliminando localidad ${localidad.nombre}:`, error);
        }
      }
      
      console.log('✅ Base de datos limpiada');
      return true;
    } catch (error) {
      console.error('Error limpiando base de datos:', error);
      return false;
    }
  }

  /**
   * Verificar si la base de datos necesita inicialización
   */
  async necesitaInicializacion(): Promise<boolean> {
    try {
      const localidades = await this.localidadService.obtenerLocalidades();
      return localidades.length === 0;
    } catch (error) {
      console.error('Error verificando estado de la base de datos:', error);
      return true; // Asumir que necesita inicialización si hay error
    }
  }
}