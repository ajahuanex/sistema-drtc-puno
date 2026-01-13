import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  ResolucionTableConfig, 
  ResolucionFiltros, 
  OrdenamientoColumna,
  FiltroActivo,
  RESOLUCION_TABLE_CONFIG_DEFAULT,
  COLUMNAS_DEFINICIONES,
  TIPOS_TRAMITE_OPCIONES,
  ESTADOS_RESOLUCION_OPCIONES
} from '../models/resolucion-table.model';

@Injectable({
  providedIn: 'root'
})
export class ResolucionesTableService {
  private readonly STORAGE_KEY = 'resoluciones-table-config';
  
  // Subjects para el estado de la tabla
  private configSubject = new BehaviorSubject<ResolucionTableConfig>(this.cargarConfiguracion());
  private filtrosSubject = new BehaviorSubject<ResolucionFiltros>({});
  
  // Observables públicos
  public config$ = this.configSubject.asObservable();
  public filtros$ = this.filtrosSubject.asObservable().pipe(
    debounceTime(300),
    distinctUntilChanged()
  );
  
  // Señales para estado reactivo
  public cargando = signal(false);
  public totalResultados = signal(0);
  public paginaActual = signal(0);

  constructor() {
    console.log('🔧 ResolucionesTableService inicializado');
  }

  // ========================================
  // GESTIÓN DE CONFIGURACIÓN
  // ========================================

  /**
   * Obtiene la configuración actual de la tabla
   */
  getConfiguracion(): ResolucionTableConfig {
    return this.configSubject.value;
  }

  /**
   * Actualiza la configuración de la tabla
   */
  actualizarConfiguracion(config: Partial<ResolucionTableConfig>): void {
    const configActual = this.configSubject.value;
    const nuevaConfig = { ...configActual, ...config };
    
    this.configSubject.next(nuevaConfig);
    this.guardarConfiguracion(nuevaConfig);
    
    console.log('⚙️ Configuración actualizada:', nuevaConfig);
  }

  /**
   * Restaura la configuración por defecto
   */
  restaurarConfiguracionDefecto(): void {
    const configDefecto = { ...RESOLUCION_TABLE_CONFIG_DEFAULT };
    this.configSubject.next(configDefecto);
    this.guardarConfiguracion(configDefecto);
    
    console.log('🔄 Configuración restaurada a valores por defecto');
  }

  // ========================================
  // GESTIÓN DE FILTROS
  // ========================================

  /**
   * Obtiene los filtros actuales
   */
  getFiltros(): ResolucionFiltros {
    return this.filtrosSubject.value;
  }

  /**
   * Actualiza los filtros
   */
  actualizarFiltros(filtros: Partial<ResolucionFiltros>): void {
    const filtrosActuales = this.filtrosSubject.value;
    const nuevosFiltros = { ...filtrosActuales, ...filtros };
    
    console.log('🔄 Actualizando filtros:');
    console.log('  - Filtros actuales:', filtrosActuales);
    console.log('  - Filtros nuevos:', filtros);
    console.log('  - Filtros combinados:', nuevosFiltros);
    
    this.filtrosSubject.next(nuevosFiltros);
    
    // También actualizar en la configuración
    this.actualizarConfiguracion({ filtros: nuevosFiltros });
    
    console.log('🔍 Filtros actualizados y emitidos');
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    const filtrosVacios: ResolucionFiltros = {};
    this.filtrosSubject.next(filtrosVacios);
    this.actualizarConfiguracion({ filtros: filtrosVacios });
    
    console.log('🧹 Filtros limpiados');
  }

  /**
   * Remueve un filtro específico
   */
  removerFiltro(key: keyof ResolucionFiltros): void {
    const filtrosActuales = { ...this.filtrosSubject.value };
    delete filtrosActuales[key];
    
    this.filtrosSubject.next(filtrosActuales);
    this.actualizarConfiguracion({ filtros: filtrosActuales });
    
    console.log('🗑️ Filtro removido:', key);
  }

  /**
   * Obtiene los filtros activos como chips
   */
  getFiltrosActivos(): FiltroActivo[] {
    const filtros = this.filtrosSubject.value;
    const filtrosActivos: FiltroActivo[] = [];

    if (filtros.numeroResolucion) {
      filtrosActivos.push({
        key: 'numeroResolucion',
        label: `Número: ${filtros.numeroResolucion}`,
        value: filtros.numeroResolucion,
        tipo: 'text'
      });
    }

    if (filtros.empresaId) {
      filtrosActivos.push({
        key: 'empresaId',
        label: `Empresa: ${filtros.empresaId}`, // TODO: Obtener nombre real
        value: filtros.empresaId,
        tipo: 'empresa'
      });
    }

    if (filtros.tiposTramite && filtros.tiposTramite.length > 0) {
      filtrosActivos.push({
        key: 'tiposTramite',
        label: `Tipos: ${filtros.tiposTramite.join(', ')}`,
        value: filtros.tiposTramite,
        tipo: 'select'
      });
    }

    if (filtros.estados && filtros.estados.length > 0) {
      filtrosActivos.push({
        key: 'estados',
        label: `Estados: ${filtros.estados.join(', ')}`,
        value: filtros.estados,
        tipo: 'select'
      });
    }

    if (filtros.fechaInicio || filtros.fechaFin) {
      const fechaTexto = this.formatearRangoFechas(filtros.fechaInicio, filtros.fechaFin);
      filtrosActivos.push({
        key: 'fechas',
        label: `Fechas: ${fechaTexto}`,
        value: { inicio: filtros.fechaInicio, fin: filtros.fechaFin },
        tipo: 'date'
      });
    }

    return filtrosActivos;
  }

  // ========================================
  // GESTIÓN DE COLUMNAS
  // ========================================

  /**
   * Obtiene las columnas visibles
   */
  getColumnasVisibles(): string[] {
    return this.configSubject.value.columnasVisibles;
  }

  /**
   * Actualiza las columnas visibles
   */
  actualizarColumnasVisibles(columnas: string[]): void {
    this.actualizarConfiguracion({ columnasVisibles: columnas });
  }

  /**
   * Reordena las columnas
   */
  reordenarColumnas(nuevoOrden: string[]): void {
    this.actualizarConfiguracion({ ordenColumnas: nuevoOrden });
  }

  /**
   * Obtiene la definición de una columna
   */
  getDefinicionColumna(key: string) {
    return COLUMNAS_DEFINICIONES.find(col => col.key === key);
  }

  /**
   * Obtiene todas las definiciones de columnas
   */
  getTodasLasColumnas() {
    return COLUMNAS_DEFINICIONES;
  }

  // ========================================
  // GESTIÓN DE ORDENAMIENTO
  // ========================================

  /**
   * Obtiene el ordenamiento actual
   */
  getOrdenamiento(): OrdenamientoColumna[] {
    return this.configSubject.value.ordenamiento;
  }

  /**
   * Actualiza el ordenamiento de una columna
   */
  actualizarOrdenamiento(columna: string, direccion?: 'asc' | 'desc'): void {
    const ordenamientoActual = [...this.configSubject.value.ordenamiento];
    const indiceExistente = ordenamientoActual.findIndex(o => o.columna === columna);

    if (direccion) {
      // Agregar o actualizar ordenamiento
      const nuevoOrdenamiento: OrdenamientoColumna = {
        columna,
        direccion,
        prioridad: indiceExistente >= 0 ? ordenamientoActual[indiceExistente].prioridad : ordenamientoActual.length + 1
      };

      if (indiceExistente >= 0) {
        ordenamientoActual[indiceExistente] = nuevoOrdenamiento;
      } else {
        ordenamientoActual.push(nuevoOrdenamiento);
      }
    } else {
      // Remover ordenamiento
      if (indiceExistente >= 0) {
        ordenamientoActual.splice(indiceExistente, 1);
      }
    }

    this.actualizarConfiguracion({ ordenamiento: ordenamientoActual });
  }

  /**
   * Limpia todo el ordenamiento
   */
  limpiarOrdenamiento(): void {
    this.actualizarConfiguracion({ ordenamiento: [] });
  }

  // ========================================
  // GESTIÓN DE PAGINACIÓN
  // ========================================

  /**
   * Actualiza la configuración de paginación
   */
  actualizarPaginacion(tamanoPagina?: number, paginaActual?: number): void {
    const paginacionActual = this.configSubject.value.paginacion;
    const nuevaPaginacion = {
      tamanoPagina: tamanoPagina ?? paginacionActual.tamanoPagina,
      paginaActual: paginaActual ?? paginacionActual.paginaActual
    };

    this.actualizarConfiguracion({ paginacion: nuevaPaginacion });
    
    if (paginaActual !== undefined) {
      this.paginaActual.set(paginaActual);
    }
  }

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Obtiene las opciones disponibles para filtros
   */
  getOpcionesFiltros() {
    return {
      tiposTramite: TIPOS_TRAMITE_OPCIONES,
      estados: ESTADOS_RESOLUCION_OPCIONES
    };
  }

  /**
   * Verifica si hay filtros activos
   */
  tieneFiltrosActivos(): boolean {
    const filtros = this.filtrosSubject.value;
    console.log('🔍 Verificando filtros activos:', filtros);
    const tieneActivos = Object.keys(filtros).some(key => {
      const valor = filtros[key as keyof ResolucionFiltros];
      const esActivo = valor !== undefined && valor !== null && 
             (Array.isArray(valor) ? valor.length > 0 : valor !== '');
      console.log(`  - ${key}: ${valor} -> ${esActivo}`);
      return esActivo;
    });
    console.log('🔍 Resultado tiene filtros activos:', tieneActivos);
    return tieneActivos;
  }

  /**
   * Formatea un rango de fechas para mostrar
   */
  private formatearRangoFechas(inicio?: Date, fin?: Date): string {
    const formatoFecha = (fecha: Date) => fecha.toLocaleDateString('es-PE');
    
    if (inicio && fin) {
      return `${formatoFecha(inicio)} - ${formatoFecha(fin)}`;
    } else if (inicio) {
      return `Desde ${formatoFecha(inicio)}`;
    } else if (fin) {
      return `Hasta ${formatoFecha(fin)}`;
    }
    
    return '';
  }

  // ========================================
  // PERSISTENCIA
  // ========================================

  /**
   * Carga la configuración desde localStorage
   */
  private cargarConfiguracion(): ResolucionTableConfig {
    try {
      const configGuardada = localStorage.getItem(this.STORAGE_KEY);
      if (configGuardada) {
        const config = JSON.parse(configGuardada);
        console.log('📂 Configuración cargada desde localStorage:', config);
        return { ...RESOLUCION_TABLE_CONFIG_DEFAULT, ...config };
      }
    } catch (error) {
      console.warn('⚠️ Error al cargar configuración desde localStorage:', error);
    }
    
    console.log('🆕 Usando configuración por defecto');
    return { ...RESOLUCION_TABLE_CONFIG_DEFAULT };
  }

  /**
   * Guarda la configuración en localStorage
   */
  private guardarConfiguracion(config: ResolucionTableConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      console.log('💾 Configuración guardada en localStorage');
    } catch (error) {
      console.warn('⚠️ Error al guardar configuración en localStorage:', error);
    }
  }
}