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

  // Configuraciones de vehículos
  categoriasVehiculos = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'CATEGORIAS_VEHICULOS');
    if (config && config.valor) {
      return config.valor.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
    }
    return ['M1', 'M2', 'M2-C3', 'M3', 'N1', 'N2', 'N3'];
  });

  estadosVehiculos = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'ESTADOS_VEHICULOS');
    if (config && config.valor) {
      return config.valor.split(',').map(estado => estado.trim()).filter(estado => estado.length > 0);
    }
    return ['HABILITADO', 'NO_HABILITADO', 'SUSPENDIDO', 'MANTENIMIENTO'];
  });

  estadoVehiculoDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'ESTADO_VEHICULO_DEFAULT');
    return config ? config.valor : 'HABILITADO';
  });

  categoriaVehiculoDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'CATEGORIA_VEHICULO_DEFAULT');
    return config ? config.valor : 'M3';
  });

  tiposCombustible = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'TIPOS_COMBUSTIBLE');
    if (config && config.valor) {
      return config.valor.split(',').map(tipo => tipo.trim()).filter(tipo => tipo.length > 0);
    }
    return ['DIESEL', 'GASOLINA', 'GAS_NATURAL', 'ELECTRICO', 'HIBRIDO'];
  });

  tipoCombustibleDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'TIPO_COMBUSTIBLE_DEFAULT');
    return config ? config.valor : 'DIESEL';
  });

  // Configuraciones de carrocería
  tiposCarroceria = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'TIPOS_CARROCERIA');
    if (config && config.valor) {
      return config.valor.split(',').map(tipo => tipo.trim()).filter(tipo => tipo.length > 0);
    }
    return ['MICROBUS', 'MINIBUS', 'OMNIBUS', 'COASTER', 'FURGON', 'CAMIONETA'];
  });

  tipoCarroceriaDefault = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'TIPO_CARROCERIA_DEFAULT');
    return config ? config.valor : 'MICROBUS';
  });

  // Configuraciones de estados de vehículos
  estadosVehiculosConfig = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'ESTADOS_VEHICULOS_CONFIG');
    if (config && config.valor) {
      try {
        return JSON.parse(config.valor);
      } catch (error) {
        console.error('Error parseando configuración de estados de vehículos::', error);
        return this.getEstadosVehiculosDefault();
      }
    }
    return this.getEstadosVehiculosDefault();
  });

  permitirCambioEstadoMasivo = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'PERMITIR_CAMBIO_ESTADO_MASIVO');
    return config ? config.valor.toLowerCase() === 'true' : true;
  });

  motivoObligatorioCambioEstado = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'MOTIVO_OBLIGATORIO_CAMBIO_ESTADO');
    return config ? config.valor.toLowerCase() === 'true' : false;
  });

  // ✅ Configuraciones de tipos de ruta
  tiposRutaConfig = computed(() => {
    const allConfigs = this.configuraciones();
    console.log('🔍 Todas las configuraciones disponibles:', allConfigs.map(c => c.nombre));
    
    const config = allConfigs.find(c => c.nombre === 'TIPOS_RUTA_CONFIG');
    console.log('🔍 Configuración TIPOS_RUTA_CONFIG encontrada:', config);
    
    if (config && config.valor) {
      try {
        const parsed = JSON.parse(config.valor);
        console.log('✅ Tipos de ruta parseados:', parsed);
        return parsed;
      } catch (error) {
        console.error('Error parseando configuración de tipos de ruta::', error);
        return this.getTiposRutaDefault();
      }
    }
    console.warn('⚠️ Usando tipos de ruta por defecto');
    return this.getTiposRutaDefault();
  });

  // ✅ Configuraciones de tipos de servicio
  tiposServicioConfig = computed(() => {
    const config = this.configuraciones().find(c => c.nombre === 'TIPOS_SERVICIO_CONFIG');
    if (config && config.valor) {
      try {
        return JSON.parse(config.valor);
      } catch (error) {
        console.error('Error parseando configuración de tipos de servicio::', error);
        return this.getTiposServicioDefault();
      }
    }
    return this.getTiposServicioDefault();
  });

  constructor() {
    // console.log removed for production
    // Cargar configuraciones automáticamente al inicializar el servicio
    this.cargarConfiguraciones().then(() => {
      // console.log removed for production
    }).catch(error => {
      console.error('❌ Error cargando configuraciones automáticamente::', error);
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Carga las configuraciones desde la API
   */
  async cargarConfiguraciones(): Promise<void> {
    try {
      console.log('🔄 Cargando configuraciones desde API:', this.apiUrl);
      this.configuracionesCargadasSignal.set(false);
      
      // Intentar cargar desde la API (sin autenticación para pruebas)
      const response = await this.http.get<ConfiguracionSistema[]>(`${this.apiUrl}`).toPromise();
      
      console.log('📦 Respuesta de API:', response);
      
      if (response && response.length > 0) {
        console.log('✅ Configuraciones cargadas desde API:', response.length);
        this.configuracionesSignal.set(response);
        this.configuracionesCargadasSignal.set(true);
        this.actualizarBehaviorSubjects(response);
        
        // Verificar TIPOS_RUTA_CONFIG
        const tiposRuta = response.find(c => c.nombre === 'TIPOS_RUTA_CONFIG');
        if (tiposRuta) {
          console.log('✅ TIPOS_RUTA_CONFIG encontrado en respuesta:', tiposRuta);
        } else {
          console.warn('⚠️ TIPOS_RUTA_CONFIG NO encontrado en respuesta');
        }
        
        return;
      }
      
      throw new Error('No se recibieron configuraciones de la API');
      
    } catch (error) {
      console.error('❌ Error cargando configuraciones desde API:', error);
      // Usar configuraciones por defecto silenciosamente
      console.log('ℹ️ Usando configuraciones por defecto (API no disponible)');
      
      // Usar configuraciones por defecto directamente
      const configuracionesDefault = this.getConfiguracionesDefault();
      this.configuracionesSignal.set(configuracionesDefault);
      this.configuracionesCargadasSignal.set(true);
      this.actualizarBehaviorSubjects(configuracionesDefault);
    }
  }

  /**
   * Obtiene las configuraciones por defecto cuando la API no está disponible
   */
  private getConfiguracionesDefault(): ConfiguracionSistema[] {
    return [
      // Configuraciones de Resoluciones
      {
        id: 'default-res-1',
        nombre: 'ANIOS_VIGENCIA_DEFAULT',
        valor: '4',
        descripcion: 'Años de vigencia por defecto para nuevas resoluciones',
        categoria: CategoriaConfiguracion.RESOLUCIONES,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-res-2',
        nombre: 'MAX_ANIOS_VIGENCIA',
        valor: '10',
        descripcion: 'Máximo de años de vigencia permitidos',
        categoria: CategoriaConfiguracion.RESOLUCIONES,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-res-3',
        nombre: 'MIN_ANIOS_VIGENCIA',
        valor: '1',
        descripcion: 'Mínimo de años de vigencia permitidos',
        categoria: CategoriaConfiguracion.RESOLUCIONES,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-res-4',
        nombre: 'PREFIJO_RESOLUCION',
        valor: 'R',
        descripcion: 'Prefijo para numeración automática de resoluciones',
        categoria: CategoriaConfiguracion.RESOLUCIONES,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },

      // Configuraciones de Expedientes
      {
        id: 'default-exp-1',
        nombre: 'TIEMPO_PROCESAMIENTO_DEFAULT',
        valor: '15',
        descripcion: 'Tiempo estimado de procesamiento en días',
        categoria: CategoriaConfiguracion.EXPEDIENTES,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-exp-2',
        nombre: 'MAX_EXPEDIENTES_OFICINA',
        valor: '200',
        descripcion: 'Máximo de expedientes por oficina',
        categoria: CategoriaConfiguracion.EXPEDIENTES,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },

      // Configuraciones de Empresas
      {
        id: 'default-emp-1',
        nombre: 'CAPACIDAD_MAXIMA_DEFAULT',
        valor: '100',
        descripcion: 'Capacidad máxima por defecto para empresas',
        categoria: CategoriaConfiguracion.EMPRESAS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-emp-2',
        nombre: 'MAX_EMPRESAS_ACTIVAS',
        valor: '1000',
        descripcion: 'Máximo de empresas activas en el sistema',
        categoria: CategoriaConfiguracion.EMPRESAS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },

      // Configuraciones de Sistema
      {
        id: 'default-sys-1',
        nombre: 'PAGINACION_DEFAULT',
        valor: '20',
        descripcion: 'Número de elementos por página',
        categoria: CategoriaConfiguracion.SISTEMA,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-sys-2',
        nombre: 'ZONA_HORARIA',
        valor: 'America/Lima',
        descripcion: 'Zona horaria del sistema',
        categoria: CategoriaConfiguracion.SISTEMA,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-sys-3',
        nombre: 'FORMATO_FECHA',
        valor: 'DD/MM/YYYY',
        descripcion: 'Formato de visualización de fechas',
        categoria: CategoriaConfiguracion.SISTEMA,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },

      // Configuraciones existentes de sedes y vehículos
      {
        id: 'default-1',
        nombre: 'SEDES_DISPONIBLES',
        valor: 'PUNO,LIMA,AREQUIPA,JULIACA,CUSCO,TACNA',
        descripcion: 'Sedes disponibles en el sistema',
        categoria: CategoriaConfiguracion.GENERAL,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-2',
        nombre: 'SEDE_DEFAULT',
        valor: 'PUNO',
        descripcion: 'Sede por defecto del sistema',
        categoria: CategoriaConfiguracion.GENERAL,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-3',
        nombre: 'CATEGORIAS_VEHICULOS',
        valor: 'M1,M2,M2-C3,M3,N1,N2,N3',
        descripcion: 'Categorías de vehículos disponibles',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-4',
        nombre: 'ESTADOS_VEHICULOS',
        valor: 'HABILITADO,NO_HABILITADO,SUSPENDIDO,MANTENIMIENTO',
        descripcion: 'Estados posibles de los vehículos',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-5',
        nombre: 'ESTADO_VEHICULO_DEFAULT',
        valor: 'HABILITADO',
        descripcion: 'Estado por defecto para nuevos vehículos',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-6',
        nombre: 'CATEGORIA_VEHICULO_DEFAULT',
        valor: 'M3',
        descripcion: 'Categoría por defecto para nuevos vehículos',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-7',
        nombre: 'TIPOS_COMBUSTIBLE',
        valor: 'DIESEL,GASOLINA,GAS_NATURAL,ELECTRICO,HIBRIDO',
        descripcion: 'Tipos de combustible disponibles',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-8',
        nombre: 'TIPO_COMBUSTIBLE_DEFAULT',
        valor: 'DIESEL',
        descripcion: 'Tipo de combustible por defecto',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-8a',
        nombre: 'TIPOS_CARROCERIA',
        valor: 'MICROBUS,MINIBUS,OMNIBUS,COASTER,FURGON,CAMIONETA',
        descripcion: 'Tipos de carrocería disponibles',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-8b',
        nombre: 'TIPO_CARROCERIA_DEFAULT',
        valor: 'MICROBUS',
        descripcion: 'Tipo de carrocería por defecto',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-9',
        nombre: 'ESTADOS_VEHICULOS_CONFIG',
        valor: JSON.stringify([
          { codigo: 'ACTIVO', nombre: 'Activo', color: '#4CAF50', descripcion: 'Vehículo operativo y disponible para servicio' },
          { codigo: 'INACTIVO', nombre: 'Inactivo', color: '#F44336', descripcion: 'Vehículo temporalmente fuera de servicio' },
          { codigo: 'MANTENIMIENTO', nombre: 'Mantenimiento', color: '#FF9800', descripcion: 'Vehículo en proceso de reparación o mantenimiento' },
          { codigo: 'SUSPENDIDO', nombre: 'Suspendido', color: '#9C27B0', descripcion: 'Vehículo suspendido por motivos administrativos' },
          { codigo: 'FUERA_DE_SERVICIO', nombre: 'Fuera de Servicio', color: '#E91E63', descripcion: 'Vehículo no operativo por tiempo indefinido' },
          { codigo: 'DADO_DE_BAJA', nombre: 'Dado de Baja', color: '#795548', descripcion: 'Vehículo dado de baja definitivamente' }
        ]),
        descripcion: 'Configuración de estados disponibles para vehículos',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-10',
        nombre: 'PERMITIR_CAMBIO_ESTADO_MASIVO',
        valor: 'true',
        descripcion: 'Habilita cambio de estado masivo',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-11',
        nombre: 'MOTIVO_OBLIGATORIO_CAMBIO_ESTADO',
        valor: 'false',
        descripcion: 'Define si el motivo es obligatorio al cambiar estado',
        categoria: CategoriaConfiguracion.VEHICULOS,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },

      // Configuraciones de tipos configurables
      {
        id: 'default-tipos-1',
        nombre: 'TIPOS_RUTA_CONFIG',
        valor: JSON.stringify([
          { codigo: 'URBANA', nombre: 'Urbana', descripcion: 'Transporte dentro de la ciudad', estaActivo: true },
          { codigo: 'INTERURBANA', nombre: 'Interurbana', descripcion: 'Transporte entre ciudades cercanas', estaActivo: true },
          { codigo: 'INTERPROVINCIAL', nombre: 'Interprovincial', descripcion: 'Transporte entre provincias', estaActivo: true },
          { codigo: 'INTERREGIONAL', nombre: 'Interregional', descripcion: 'Transporte entre regiones', estaActivo: true },
          { codigo: 'RURAL', nombre: 'Rural', descripcion: 'Transporte en zonas rurales', estaActivo: true }
        ]),
        descripcion: 'Configuración de tipos de ruta disponibles',
        categoria: CategoriaConfiguracion.SISTEMA,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: 'default-tipos-2',
        nombre: 'TIPOS_SERVICIO_CONFIG',
        valor: JSON.stringify([
          { codigo: 'PASAJEROS', nombre: 'Transporte de Pasajeros', descripcion: 'Servicio de transporte público de personas', estaActivo: true },
          { codigo: 'CARGA', nombre: 'Transporte de Carga', descripcion: 'Servicio de transporte de mercancías y productos', estaActivo: true },
          { codigo: 'MIXTO', nombre: 'Transporte Mixto', descripcion: 'Servicio combinado de pasajeros y carga', estaActivo: true }
        ]),
        descripcion: 'Configuración de tipos de servicio disponibles',
        categoria: CategoriaConfiguracion.SISTEMA,
        activo: true,
        esEditable: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      }
    ];
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
  /**
   * Actualiza una configuración
   */
  async actualizarConfiguracion(id: string, valor: string): Promise<boolean> {
    try {
      const updateData = { valor };
      
      const response = await this.http.put<ConfiguracionSistema>(
        `${this.apiUrl}/${id}`,
        updateData,
        { headers: this.getHeaders() }
      ).toPromise();
      
      if (response) {
        // Actualizar la configuración en el signal
        const configuraciones = this.configuracionesSignal();
        const index = configuraciones.findIndex(c => c.id === id);
        if (index !== -1) {
          configuraciones[index] = response;
          this.configuracionesSignal.set([...configuraciones]);
          this.actualizarBehaviorSubjects(configuraciones);
        }
        
        // console.log removed for production
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error actualizando configuración::', error);
      throw error;
    }
  }

  /**
   * Crea una nueva configuración
   */
  crearConfiguracion(configuracion: ConfiguracionCreate): Observable<ConfiguracionSistema> {
    // console.log removed for production
    
    return this.http.post<ConfiguracionSistema>(this.apiUrl, configuracion, { headers: this.getHeaders() })
      .pipe(
        tap((nuevaConfiguracion) => {
          // console.log removed for production
          // Agregar al signal local
          const configuraciones = this.configuraciones();
          configuraciones.push(nuevaConfiguracion);
          this.configuracionesSignal.set([...configuraciones]);
        }),
        catchError(error => {
          console.error('❌ Error creando configuración::', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene configuraciones por categoría desde la API
   */
  async obtenerConfiguracionesPorCategoria(categoria: CategoriaConfiguracion): Promise<ConfiguracionSistema[]> {
    try {
      const response = await this.http.get<ConfiguracionSistema[]>(
        `${this.apiUrl}?categoria=${categoria}`,
        { headers: this.getHeaders() }
      ).toPromise();
      
      return response || [];
      
    } catch (error) {
      console.error(`❌ Error obteniendo configuraciones de ${categoria}:`, error);
      return [];
    }
  }

  /**
   * Obtiene configuraciones por categoría (método local)
   */
  getConfiguracionesPorCategoria(categoria: CategoriaConfiguracion): ConfiguracionSistema[] {
    return this.configuraciones().filter(c => c.categoria === categoria);
  }

  /**
   * Resetea una configuración a su valor por defecto
   */
  resetearConfiguracion(nombre: string): Observable<ConfiguracionSistema> {
    // console.log removed for production
    const url = `${this.apiUrl}/reset/${nombre}`;
    
    return this.http.post<ConfiguracionSistema>(url, {}, { headers: this.getHeaders() }).pipe(
      tap(configuracionReseteada => {
        // console.log removed for production
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
        console.error('❌ Error reseteando configuración::', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Resetea todas las configuraciones a sus valores por defecto
   */
  resetearTodasLasConfiguraciones(): Observable<ConfiguracionSistema[]> {
    // console.log removed for production
    
    const url = `${this.apiUrl}/reset`;
    return this.http.post<ConfiguracionSistema[]>(url, {}, { headers: this.getHeaders() })
      .pipe(
        tap((configuracionesReseteadas) => {
          // console.log removed for production
          this.configuracionesSignal.set(configuracionesReseteadas);
          this.actualizarBehaviorSubjects(configuracionesReseteadas);
        }),
        catchError(error => {
          console.error('❌ Error reseteando configuraciones::', error);
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
          return this.actualizarConfiguracion(config.id, config.valor);
        }
        return of(null);
      });

      return of(datos.configuraciones).pipe(
        tap(() => {
          // console.log removed for production
        })
      );
    } catch (error) {
      console.error('Error importando configuraciones::', error);
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
      console.error('Error formateando fecha::', error);
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
      console.error('Error formateando fecha con hora::', error);
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

  /**
   * Obtiene los estados de vehículos por defecto
   */
  private getEstadosVehiculosDefault() {
    return [
      { codigo: 'ACTIVO', nombre: 'Activo', color: '#4CAF50', descripcion: 'Vehículo operativo y disponible para servicio' },
      { codigo: 'INACTIVO', nombre: 'Inactivo', color: '#F44336', descripcion: 'Vehículo temporalmente fuera de servicio' },
      { codigo: 'MANTENIMIENTO', nombre: 'Mantenimiento', color: '#FF9800', descripcion: 'Vehículo en proceso de reparación o mantenimiento' },
      { codigo: 'SUSPENDIDO', nombre: 'Suspendido', color: '#9C27B0', descripcion: 'Vehículo suspendido por motivos administrativos' },
      { codigo: 'FUERA_DE_SERVICIO', nombre: 'Fuera de Servicio', color: '#E91E63', descripcion: 'Vehículo no operativo por tiempo indefinido' },
      { codigo: 'DADO_DE_BAJA', nombre: 'Dado de Baja', color: '#795548', descripcion: 'Vehículo dado de baja definitivamente' }
    ];
  }

  /**
   * Obtiene un estado específico por código
   */
  getEstadoVehiculo(codigo: string) {
    const estados = this.estadosVehiculosConfig();
    return estados.find((estado: any) => estado.codigo === codigo);
  }

  /**
   * Obtiene el color de un estado específico
   */
  getColorEstadoVehiculo(codigo: string): string {
    const estado = this.getEstadoVehiculo(codigo);
    return estado ? estado.color : '#757575';
  }

  /**
   * Obtiene los tipos de ruta por defecto
   */
  private getTiposRutaDefault() {
    return [
      { codigo: 'URBANA', nombre: 'Urbana', descripcion: 'Transporte dentro de la ciudad', estaActivo: true },
      { codigo: 'INTERURBANA', nombre: 'Interurbana', descripcion: 'Transporte entre ciudades cercanas', estaActivo: true },
      { codigo: 'INTERPROVINCIAL', nombre: 'Interprovincial', descripcion: 'Transporte entre provincias', estaActivo: true },
      { codigo: 'INTERREGIONAL', nombre: 'Interregional', descripcion: 'Transporte entre regiones', estaActivo: true },
      { codigo: 'RURAL', nombre: 'Rural', descripcion: 'Transporte en zonas rurales', estaActivo: true }
    ];
  }

  /**
   * Obtiene los tipos de servicio por defecto
   */
  private getTiposServicioDefault() {
    return [
      { codigo: 'PASAJEROS', nombre: 'Transporte de Pasajeros', descripcion: 'Servicio de transporte público de personas', estaActivo: true },
      { codigo: 'CARGA', nombre: 'Transporte de Carga', descripcion: 'Servicio de transporte de mercancías y productos', estaActivo: true },
      { codigo: 'MIXTO', nombre: 'Transporte Mixto', descripcion: 'Servicio combinado de pasajeros y carga', estaActivo: true }
    ];
  }
}
