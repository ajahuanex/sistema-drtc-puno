import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { 
  ConfiguracionSistema, 
  ConfiguracionCreate, 
  ConfiguracionUpdate, 
  CONFIGURACIONES_DEFAULT,
  CategoriaConfiguracion 
} from '../models/configuracion.model';
import { DescripcionAutomaticaService } from './descripcion-automatica.service';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private http = inject(HttpClient);
  private descripcionService = inject(DescripcionAutomaticaService);
  private apiUrl = `${environment.apiUrl}/api/v1/configuraciones`;

  // Signals para las configuraciones
  private configuracionesSignal = signal<ConfiguracionSistema[]>([]);
  private configuracionesCargadasSignal = signal(false);

  // BehaviorSubject para configuraciones específicas
  private aniosVigenciaDefaultSubject = new BehaviorSubject<number>(5);
  private maxAniosVigenciaSubject = new BehaviorSubject<number>(10);
  private minAniosVigenciaSubject = new BehaviorSubject<number>(1);

  // Computed properties para configuraciones específicas
  configuraciones = computed(() => this.configuracionesSignal());
  configuracionesCargadas = computed(() => this.configuracionesCargadasSignal());
  
  // Configuraciones específicas como computed
  aniosVigenciaDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'ANIOS_VIGENCIA_DEFAULT');
    return config ? parseInt(config.valor) : 5;
  });

  maxAniosVigencia = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'MAX_ANIOS_VIGENCIA');
    return config ? parseInt(config.valor) : 10;
  });

  minAniosVigencia = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'MIN_ANIOS_VIGENCIA');
    return config ? parseInt(config.valor) : 1;
  });

  tiempoProcesamientoDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'TIEMPO_PROCESAMIENTO_DEFAULT');
    return config ? parseInt(config.valor) : 15;
  });

  capacidadMaximaDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'CAPACIDAD_MAXIMA_DEFAULT');
    return config ? parseInt(config.valor) : 100;
  });

  paginacionDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'PAGINACION_DEFAULT');
    return config ? parseInt(config.valor) : 20;
  });

  constructor() {
    // Inicializar configuraciones inmediatamente sin backend
    this.crearConfiguracionesDefault();
  }



  /**
   * Carga todas las configuraciones desde el backend
   */
  cargarConfiguraciones(): Observable<ConfiguracionSistema[]> {
    // Por ahora, retornar configuraciones locales
    return new Observable(observer => {
      try {
        // Simular delay de carga
        setTimeout(() => {
          const configuraciones = this.configuraciones();
          console.log('🔧 Configuraciones cargadas localmente:', configuraciones.length);
          observer.next(configuraciones);
          observer.complete();
        }, 100);
      } catch (error) {
        console.error('Error cargando configuraciones:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Crea las configuraciones por defecto del sistema
   */
  private crearConfiguracionesDefault(): void {
    console.log('🔧 Creando configuraciones por defecto...');
    
    const configuracionesDefault: ConfiguracionSistema[] = Object.values(CONFIGURACIONES_DEFAULT).map(config => ({
      id: `default_${config.nombre}`,
      ...config,
      // Generar descripción automática basándose en el contexto
      descripcion: this.descripcionService.generarDescripcionAutomatica(
        config.nombre, 
        config.categoria
      ),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      usuarioCreadorId: 'system',
      usuarioActualizadorId: 'system'
    }));

    this.configuracionesSignal.set(configuracionesDefault);
    this.configuracionesCargadasSignal.set(true);
    this.actualizarBehaviorSubjects(configuracionesDefault);
  }

  /**
   * Actualiza los BehaviorSubjects con los valores de las configuraciones
   */
  private actualizarBehaviorSubjects(configuraciones: ConfiguracionSistema[]): void {
    const aniosVigenciaConfig = configuraciones.find(c => c.nombre === 'ANIOS_VIGENCIA_DEFAULT');
    if (aniosVigenciaConfig) {
      this.aniosVigenciaDefaultSubject.next(parseInt(aniosVigenciaConfig.valor));
    }

    const maxAniosConfig = configuraciones.find(c => c.nombre === 'MAX_ANIOS_VIGENCIA');
    if (maxAniosConfig) {
      this.maxAniosVigenciaSubject.next(parseInt(maxAniosConfig.valor));
    }

    const minAniosConfig = configuraciones.find(c => c.nombre === 'MIN_ANIOS_VIGENCIA');
    if (minAniosConfig) {
      this.minAniosVigenciaSubject.next(parseInt(minAniosConfig.valor));
    }
  }

  /**
   * Obtiene una configuración específica por nombre
   */
  getConfiguracion(nombre: string): ConfiguracionSistema | undefined {
    return this.configuraciones().find(c => c.nombre === nombre);
  }

  /**
   * Obtiene el valor de una configuración específica
   */
  getValorConfiguracion(nombre: string): string | null {
    const config = this.getConfiguracion(nombre);
    return config ? config.valor : null;
  }

  /**
   * Obtiene el valor numérico de una configuración específica
   */
  getValorNumerico(nombre: string): number | null {
    const valor = this.getValorConfiguracion(nombre);
    return valor ? parseInt(valor) : null;
  }

  /**
   * Obtiene el valor booleano de una configuración específica
   */
  getValorBooleano(nombre: string): boolean | null {
    const valor = this.getValorConfiguracion(nombre);
    return valor ? valor.toLowerCase() === 'true' : null;
  }

  /**
   * Actualiza una configuración específica
   */
  actualizarConfiguracion(id: string, configuracion: ConfiguracionUpdate): Observable<ConfiguracionSistema> {
    // Por ahora, actualizar solo localmente sin backend
    return new Observable(observer => {
      try {
        const configuraciones = this.configuraciones();
        const index = configuraciones.findIndex(c => c.id === id);
        
        if (index !== -1) {
          // Crear configuración actualizada
          const configuracionActualizada: ConfiguracionSistema = {
            ...configuraciones[index],
            ...configuracion,
            fechaActualizacion: new Date(),
            usuarioActualizadorId: 'usuario_actual'
          };
          
          // Actualizar localmente
          configuraciones[index] = configuracionActualizada;
          this.configuracionesSignal.set([...configuraciones]);
          
          // Actualizar BehaviorSubjects si es necesario
          this.actualizarBehaviorSubjects(configuraciones);
          
          console.log('🔧 Configuración actualizada localmente:', configuracionActualizada);
          observer.next(configuracionActualizada);
          observer.complete();
        } else {
          observer.error(new Error(`Configuración con ID ${id} no encontrada`));
        }
      } catch (error) {
        console.error('Error actualizando configuración localmente:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Actualiza la descripción de una configuración automáticamente basándose en el contexto
   */
  actualizarDescripcionAutomatica(id: string, contexto?: any): Observable<ConfiguracionSistema> {
    return new Observable(observer => {
      try {
        const configuraciones = this.configuraciones();
        const index = configuraciones.findIndex(c => c.id === id);
        
        if (index !== -1) {
          const config = configuraciones[index];
          const nuevaDescripcion = this.descripcionService.actualizarDescripcionAutomatica(
            config.nombre,
            config.categoria,
            contexto
          );
          
          const configuracionActualizada: ConfiguracionSistema = {
            ...config,
            descripcion: nuevaDescripcion,
            fechaActualizacion: new Date(),
            usuarioActualizadorId: 'usuario_actual'
          };
          
          // Actualizar localmente
          configuraciones[index] = configuracionActualizada;
          this.configuracionesSignal.set([...configuraciones]);
          
          console.log('🔧 Descripción actualizada automáticamente:', configuracionActualizada);
          observer.next(configuracionActualizada);
          observer.complete();
        } else {
          observer.error(new Error(`Configuración con ID ${id} no encontrada`));
        }
      } catch (error) {
        console.error('Error actualizando descripción automática:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Regenera todas las descripciones automáticamente basándose en el contexto
   */
  regenerarTodasLasDescripciones(contexto?: any): Observable<ConfiguracionSistema[]> {
    return new Observable(observer => {
      try {
        const configuraciones = this.configuraciones();
        const configuracionesActualizadas: ConfiguracionSistema[] = [];
        
        configuraciones.forEach(config => {
          const nuevaDescripcion = this.descripcionService.actualizarDescripcionAutomatica(
            config.nombre,
            config.categoria,
            contexto
          );
          
          const configuracionActualizada: ConfiguracionSistema = {
            ...config,
            descripcion: nuevaDescripcion,
            fechaActualizacion: new Date(),
            usuarioActualizadorId: 'usuario_actual'
          };
          
          configuracionesActualizadas.push(configuracionActualizada);
        });
        
        // Actualizar localmente
        this.configuracionesSignal.set(configuracionesActualizadas);
        
        console.log('🔧 Todas las descripciones regeneradas automáticamente');
        observer.next(configuracionesActualizadas);
        observer.complete();
      } catch (error) {
        console.error('Error regenerando descripciones:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Crea una nueva configuración
   */
  crearConfiguracion(configuracion: ConfiguracionCreate): Observable<ConfiguracionSistema> {
    return new Observable(observer => {
      try {
        const nuevaConfiguracion: ConfiguracionSistema = {
          id: `config_${Date.now()}`,
          ...configuracion,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
          usuarioCreadorId: 'usuario_actual',
          usuarioActualizadorId: 'usuario_actual'
        };
        
        // Agregar al signal local
        const configuraciones = this.configuraciones();
        configuraciones.push(nuevaConfiguracion);
        this.configuracionesSignal.set([...configuraciones]);
        
        console.log('🔧 Nueva configuración creada localmente:', nuevaConfiguracion);
        observer.next(nuevaConfiguracion);
        observer.complete();
      } catch (error) {
        console.error('Error creando configuración:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Obtiene configuraciones por categoría
   */
  getConfiguracionesPorCategoria(categoria: CategoriaConfiguracion): ConfiguracionSistema[] {
    return this.configuraciones().filter(c => c.categoria === categoria);
  }

  /**
   * Resetea una configuración a su valor por defecto
   */
  resetearConfiguracion(nombre: string): Observable<ConfiguracionSistema> {
    const configuracionDefault = CONFIGURACIONES_DEFAULT[nombre as keyof typeof CONFIGURACIONES_DEFAULT];
    if (!configuracionDefault) {
      throw new Error(`Configuración ${nombre} no encontrada en valores por defecto`);
    }

    const configuracionActual = this.getConfiguracion(nombre);
    if (!configuracionActual) {
      throw new Error(`Configuración ${nombre} no encontrada en el sistema`);
    }

    return this.actualizarConfiguracion(configuracionActual.id, {
      valor: configuracionDefault.valor,
      descripcion: configuracionDefault.descripcion
    });
  }

  /**
   * Resetea todas las configuraciones a sus valores por defecto
   */
  resetearTodasLasConfiguraciones(): Observable<ConfiguracionSistema[]> {
    return new Observable(observer => {
      try {
        const configuraciones = this.configuraciones();
        const configuracionesReseteadas: ConfiguracionSistema[] = [];
        
        configuraciones.forEach(config => {
          const configuracionDefault = Object.values(CONFIGURACIONES_DEFAULT)
            .find(c => c.nombre === config.nombre);
          
          if (configuracionDefault) {
            const configuracionReseteada: ConfiguracionSistema = {
              ...config,
              valor: configuracionDefault.valor,
              descripcion: configuracionDefault.descripcion,
              fechaActualizacion: new Date(),
              usuarioActualizadorId: 'usuario_actual'
            };
            configuracionesReseteadas.push(configuracionReseteada);
          } else {
            configuracionesReseteadas.push(config);
          }
        });
        
        // Actualizar localmente
        this.configuracionesSignal.set(configuracionesReseteadas);
        this.actualizarBehaviorSubjects(configuracionesReseteadas);
        
        console.log('🔧 Todas las configuraciones reseteadas localmente a valores por defecto');
        observer.next(configuracionesReseteadas);
        observer.complete();
      } catch (error) {
        console.error('Error reseteando configuraciones:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Exporta las configuraciones actuales
   */
  exportarConfiguraciones(): string {
    const configuraciones = this.configuraciones();
    const datos = {
      fechaExportacion: new Date().toISOString(),
      configuraciones: configuraciones
    };
    
    return JSON.stringify(datos, null, 2);
  }

  /**
   * Importa configuraciones desde un archivo JSON
   */
  importarConfiguraciones(jsonData: string): Observable<ConfiguracionSistema[]> {
    try {
      const datos = JSON.parse(jsonData);
      if (!datos.configuraciones || !Array.isArray(datos.configuraciones)) {
        throw new Error('Formato de archivo inválido');
      }

      // Validar y actualizar configuraciones
      const actualizaciones = datos.configuraciones.map((config: any) => {
        if (config.id && config.valor) {
          return this.actualizarConfiguracion(config.id, {
            valor: config.valor,
            descripcion: config.descripcion || ''
          });
        }
        return of(null);
      });

      return of(datos.configuraciones).pipe(
        tap(() => {
          console.log('🔧 Configuraciones importadas exitosamente');
        })
      );
    } catch (error) {
      console.error('Error importando configuraciones:', error);
      throw error;
    }
  }
} 