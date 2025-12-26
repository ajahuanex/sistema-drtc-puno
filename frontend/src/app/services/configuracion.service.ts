import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

import { 
  ConfiguracionSistema, 
  ConfiguracionCreate, 
  ConfiguracionUpdate, 
  CategoriaConfiguracion 
} from '../models/configuracion.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/configuraciones`;

  // Signals para las configuraciones
  private configuracionesSignal = signal<ConfiguracionSistema[]>([]);
  private configuracionesCargadasSignal = signal(false);

  // BehaviorSubject para configuraciones específicas
  private aniosVigenciaDefaultSubject = new BehaviorSubject<number>(4);
  private maxAniosVigenciaSubject = new BehaviorSubject<number>(10);
  private minAniosVigenciaSubject = new BehaviorSubject<number>(1);

  // Computed properties para configuraciones específicas
  configuraciones = computed(() => this.configuracionesSignal());
  configuracionesCargadas = computed(() => this.configuracionesCargadasSignal());
  
  // Configuraciones específicas como computed
  aniosVigenciaDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'ANIOS_VIGENCIA_DEFAULT');
    return config ? parseInt(config.valor) : 4;
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

  zonaHoraria = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'ZONA_HORARIA');
    return config ? config.valor : 'America/Lima';
  });

  offsetZonaHoraria = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'OFFSET_ZONA_HORARIA');
    return config ? parseInt(config.valor) : -5;
  });

  formatoFecha = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'FORMATO_FECHA');
    return config ? config.valor : 'DD/MM/YYYY';
  });

  formatoFechaHora = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'FORMATO_FECHA_HORA');
    return config ? config.valor : 'DD/MM/YYYY HH:mm';
  });

  // Configuraciones de sedes
  sedesDisponibles = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'SEDES_DISPONIBLES');
    if (config && config.valor) {
      return config.valor.split(',').map(sede => sede.trim().toUpperCase()).filter(sede => sede.length > 0);
    }
    return ['PUNO', 'LIMA', 'AREQUIPA', 'JULIACA', 'CUSCO', 'TACNA'];
  });

  sedeDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'SEDE_DEFAULT');
    return config ? config.valor.toUpperCase() : 'PUNO';
  });

  constructor() {
    console.log('🔧 ConfiguracionService inicializado - usando únicamente API');
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Carga todas las configuraciones desde el backend
   */
  cargarConfiguraciones(): Observable<ConfiguracionSistema[]> {
    console.log('🔍 Cargando configuraciones desde API...');
    
    return this.http.get<ConfiguracionSistema[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        tap((configuraciones) => {
          console.log('✅ Configuraciones cargadas desde API:', configuraciones.length);
          this.configuracionesSignal.set(configuraciones);
          this.configuracionesCargadasSignal.set(true);
          this.actualizarBehaviorSubjects(configuraciones);
        }),
        catchError(error => {
          console.error('❌ Error cargando configuraciones desde API:', error);
          return throwError(() => error);
        })
      );
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
    console.log('📤 Actualizando configuración en backend:', id, configuracion);
    
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<ConfiguracionSistema>(url, configuracion, { headers: this.getHeaders() })
      .pipe(
        tap((configuracionActualizada) => {
          console.log('✅ Configuración actualizada en backend:', configuracionActualizada);
          // Actualizar en el signal local
          const configuraciones = this.configuraciones();
          const index = configuraciones.findIndex(c => c.id === id);
          if (index !== -1) {
            configuraciones[index] = configuracionActualizada;
            this.configuracionesSignal.set([...configuraciones]);
            this.actualizarBehaviorSubjects(configuraciones);
          }
        }),
        catchError(error => {
          console.error('❌ Error actualizando configuración:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Crea una nueva configuración
   */
  crearConfiguracion(configuracion: ConfiguracionCreate): Observable<ConfiguracionSistema> {
    console.log('📤 Creando configuración en backend:', configuracion);
    
    return this.http.post<ConfiguracionSistema>(this.apiUrl, configuracion, { headers: this.getHeaders() })
      .pipe(
        tap((nuevaConfiguracion) => {
          console.log('✅ Configuración creada en backend:', nuevaConfiguracion);
          // Agregar al signal local
          const configuraciones = this.configuraciones();
          configuraciones.push(nuevaConfiguracion);
          this.configuracionesSignal.set([...configuraciones]);
        }),
        catchError(error => {
          console.error('❌ Error creando configuración:', error);
          return throwError(() => error);
        })
      );
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
    console.log('📤 Reseteando configuración en API:', nombre);
    const url = `${this.apiUrl}/reset/${nombre}`;
    
    return this.http.post<ConfiguracionSistema>(url, {}, { headers: this.getHeaders() }).pipe(
      tap(configuracionReseteada => {
        console.log('✅ Configuración reseteada en API:', configuracionReseteada);
        // Actualizar en el signal local
        const configuraciones = this.configuraciones();
        const index = configuraciones.findIndex(c => c.nombre === nombre);
        if (index !== -1) {
          configuraciones[index] = configuracionReseteada;
          this.configuracionesSignal.set([...configuraciones]);
          this.actualizarBehaviorSubjects(configuraciones);
        }
      }),
      catchError(error => {
        console.error('❌ Error reseteando configuración:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Resetea todas las configuraciones a sus valores por defecto
   */
  resetearTodasLasConfiguraciones(): Observable<ConfiguracionSistema[]> {
    console.log('📤 Reseteando todas las configuraciones en API...');
    
    const url = `${this.apiUrl}/reset`;
    return this.http.post<ConfiguracionSistema[]>(url, {}, { headers: this.getHeaders() })
      .pipe(
        tap((configuracionesReseteadas) => {
          console.log('✅ Configuraciones reseteadas en API:', configuracionesReseteadas.length);
          this.configuracionesSignal.set(configuracionesReseteadas);
          this.actualizarBehaviorSubjects(configuracionesReseteadas);
        }),
        catchError(error => {
          console.error('❌ Error reseteando configuraciones:', error);
          return throwError(() => error);
        })
      );
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

  /**
   * Formatea una fecha según la configuración del sistema
   * Usa la zona horaria y formato configurados
   */
  formatearFecha(fecha: Date | string | null): string {
    if (!fecha) return 'NO DISPONIBLE';

    try {
      const fechaObj = new Date(fecha);
      const offset = this.offsetZonaHoraria();
      
      // Ajustar a zona horaria configurada
      const fechaAjustada = new Date(fechaObj.getTime() + (offset * 60 * 60 * 1000));
      
      const dia = fechaAjustada.getDate().toString().padStart(2, '0');
      const mes = (fechaAjustada.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaAjustada.getFullYear();
      
      // Por ahora usar formato fijo DD/MM/YYYY
      // TODO: Implementar parser dinámico del formato configurado
      return `${dia}/${mes}/${anio}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'FECHA INVÁLIDA';
    }
  }

  /**
   * Formatea una fecha con hora según la configuración del sistema
   */
  formatearFechaHora(fecha: Date | string | null): string {
    if (!fecha) return 'NO DISPONIBLE';

    try {
      const fechaObj = new Date(fecha);
      const offset = this.offsetZonaHoraria();
      
      // Ajustar a zona horaria configurada
      const fechaAjustada = new Date(fechaObj.getTime() + (offset * 60 * 60 * 1000));
      
      const dia = fechaAjustada.getDate().toString().padStart(2, '0');
      const mes = (fechaAjustada.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaAjustada.getFullYear();
      const hora = fechaAjustada.getHours().toString().padStart(2, '0');
      const minutos = fechaAjustada.getMinutes().toString().padStart(2, '0');
      
      // Por ahora usar formato fijo DD/MM/YYYY HH:mm
      // TODO: Implementar parser dinámico del formato configurado
      return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
    } catch (error) {
      console.error('Error formateando fecha con hora:', error);
      return 'FECHA INVÁLIDA';
    }
  }

  /**
   * Obtiene la fecha actual ajustada a la zona horaria configurada
   */
  obtenerFechaActual(): Date {
    const ahora = new Date();
    const offset = this.offsetZonaHoraria();
    return new Date(ahora.getTime() + (offset * 60 * 60 * 1000));
  }
}
