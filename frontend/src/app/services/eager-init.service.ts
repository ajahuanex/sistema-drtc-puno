import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, catchError, tap, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CriticalConfig {
  apiUrl: string;
  environment: string;
  features: string[];
  cacheConfig: {
    ttl: number;
    maxSize: number;
  };
}

export interface AppState {
  isInitialized: boolean;
  isHydrated: boolean;
  criticalData: CriticalConfig | null;
  userPreferences: any;
  cacheStats: {
    hits: number;
    misses: number;
    size: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EagerInitService {
  private http = inject(HttpClient);
  
  // Signals para estado de la aplicación
  private readonly _appState = signal<AppState>({
    isInitialized: false,
    isHydrated: false,
    criticalData: null,
    userPreferences: null,
    cacheStats: { hits: 0, misses: 0, size: 0 }
  });

  // Signals públicos
  readonly appState = this._appState.asReadonly();
  readonly isInitialized = computed(() => this._appState().isInitialized);
  readonly isHydrated = computed(() => this._appState().isHydrated);
  readonly criticalData = computed(() => this._appState().criticalData);
  readonly cacheStats = computed(() => this._appState().cacheStats);

  // BehaviorSubjects para compatibilidad con RxJS
  private readonly _initializationStatus$ = new BehaviorSubject<boolean>(false);
  readonly initializationStatus$ = this._initializationStatus$.asObservable();

  // Cache en memoria para datos críticos
  private readonly memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly cacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    maxSize: 100
  };

  constructor() {
    console.log('🔧 [EAGER-INIT] Constructor iniciado');
    // Inicialización automática (solo una vez)
    console.log('🔧 [EAGER-INIT] Llamando initializeApp...');
    this.initializeApp();
    console.log('🔧 [EAGER-INIT] Constructor completado');
  }

  /**
   * Inicialización eager de la aplicación
   */
  async initializeApp(): Promise<void> {
    console.log('🚀 [INIT] Iniciando aplicación...');
    
    try {
      // 1. Cargar configuración crítica
      console.log('📋 [INIT] Paso 1: Cargando configuración crítica...');
      await this.loadCriticalConfig();
      console.log('✅ [INIT] Configuración crítica cargada');
      
      // 2. Pre-cargar datos esenciales
      console.log('📦 [INIT] Paso 2: Pre-cargando datos esenciales...');
      await this.preloadEssentialData();
      console.log('✅ [INIT] Datos esenciales pre-cargados');
      
      // 3. Inicializar cache y preferencias
      console.log('💾 [INIT] Paso 3: Inicializando cache...');
      await this.initializeCache();
      console.log('✅ [INIT] Cache inicializado');
      
      // 4. Marcar como inicializado
      this._appState.update(state => ({
        ...state,
        isInitialized: true
      }));
      
      this._initializationStatus$.next(true);
      
      console.log('✅ [INIT] Aplicación inicializada correctamente');
      
    } catch (error) {
      console.error('❌ [INIT] Error en inicialización eager:', error);
      // Fallback a configuración por defecto
      this.setDefaultConfig();
    }
  }

  /**
   * Cargar configuración crítica
   */
  private async loadCriticalConfig(): Promise<void> {
    console.log('🔍 [INIT] loadCriticalConfig - Usando configuración por defecto');
    
    // SIMPLIFICADO: Usar siempre configuración por defecto
    // No intentar cargar desde API ni sessionStorage
    this.setDefaultConfig();
    
    console.log('✅ [INIT] Configuración por defecto establecida');
    return;
    
    /* CÓDIGO ORIGINAL DESHABILITADO
    try {
      // Intentar cargar desde sessionStorage primero
      const cached = sessionStorage.getItem('criticalConfig');
      if (cached) {
        const config = JSON.parse(cached);
        this._appState.update(state => ({
          ...state,
          criticalData: config
        }));
        return;
      }

      // Si no hay cache, cargar desde API
      const config = await this.http.get<CriticalConfig>('/api/config/critical').toPromise();
      if (config) {
        this._appState.update(state => ({
          ...state,
          criticalData: config
        }));
        
        // Guardar en sessionStorage
        sessionStorage.setItem('criticalConfig', JSON.stringify(config));
      }
    } catch (error) {
      console.warn('⚠️ No se pudo cargar configuración crítica, usando valores por defecto');
      // Usar configuración por defecto cuando falla la API
      this.setDefaultConfig();
    }
    */
  }

  /**
   * Pre-cargar datos esenciales
   * DESHABILITADO TEMPORALMENTE para debugging
   */
  private async preloadEssentialData(): Promise<void> {
    console.log('🔍 [INIT] preloadEssentialData - DESHABILITADO');
    
    // Solo cargar preferencias de usuario (ligero)
    await this.preloadUserPreferences();
    
    // DESHABILITADO: Resto de pre-cargas
    console.log('⚠️ [INIT] Pre-carga de datos comunes y UI DESHABILITADA');
    return;
    
    /* CÓDIGO ORIGINAL DESHABILITADO
    const preloadTasks = [
      this.preloadUserPreferences(),
      this.preloadCommonData(),
      this.preloadUIComponents()
      // Removemos preloadConfiguraciones() ya que se carga automáticamente en el servicio
    ];

    await Promise.allSettled(preloadTasks);
    */
  }

  /**
   * Pre-cargar preferencias del usuario
   */
  private async preloadUserPreferences(): Promise<void> {
    try {
      const prefs = localStorage.getItem('userPreferences');
      if (prefs) {
        const preferences = JSON.parse(prefs);
        this._appState.update(state => ({
          ...state,
          userPreferences: preferences
        }));
      }
    } catch (error) {
      console.warn('⚠️ Error cargando preferencias del usuario');
    }
  }

  /**
   * Pre-cargar datos comunes
   * DESHABILITADO: Puede causar problemas de carga
   */
  private async preloadCommonData(): Promise<void> {
    console.log('🔍 [CACHE] Iniciando preloadCommonData...');
    
    // DESHABILITADO: Pre-carga de datos comunes
    console.log('⚠️ [CACHE] Pre-carga de datos comunes DESHABILITADA');
    console.log('💡 [CACHE] Los datos se cargarán bajo demanda');
    return;
    
    /* CÓDIGO ORIGINAL DESHABILITADO
    // Pre-cargar datos que se usan frecuentemente
    // Por ahora, solo cargar desde localStorage si existe
    const commonDataKeys = ['tiposDocumento', 'estadosEmpresa', 'configuracionGeneral'];
    
    for (const key of commonDataKeys) {
      try {
        const cached = localStorage.getItem(`common_${key}`);
        if (cached) {
          const data = JSON.parse(cached);
          this.setCacheItem(key, data, this.cacheConfig.defaultTTL);
        }
      } catch (error) {
        // Ignorar errores de pre-carga
      }
    }
    */
  }

  /**
   * Pre-cargar componentes de UI
   */
  private async preloadUIComponents(): Promise<void> {
    // Pre-cargar componentes críticos de la UI
    const criticalComponents = [
      'mat-card',
      'mat-button',
      'mat-form-field',
      'mat-table'
    ];

    // Simular pre-carga de componentes
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Inicializar sistema de cache
   */
  private async initializeCache(): Promise<void> {
    // Limpiar cache expirado
    this.cleanExpiredCache();
    
    // Configurar limpieza automática del cache
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60000); // Cada minuto
  }

  /**
   * Configuración por defecto en caso de error
   */
  private setDefaultConfig(): void {
    const defaultConfig: CriticalConfig = {
      apiUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200',
      environment: 'development',
      features: ['empresas', 'vehiculos', 'conductores', 'resoluciones', 'rutas'],
      cacheConfig: {
        ttl: 300000, // 5 minutos
        maxSize: 100
      }
    };

    this._appState.update(state => ({
      ...state,
      criticalData: defaultConfig,
      isInitialized: true
    }));

    // Guardar en sessionStorage para futuras referencias
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('criticalConfig', JSON.stringify(defaultConfig));
    }
  }

  /**
   * Marcar hidratación como completa
   */
  markHydrationComplete(): void {
    console.log('🔧 [EAGER-INIT] markHydrationComplete llamado');
    const wasHydrated = this._appState().isHydrated;
    console.log('🔧 [EAGER-INIT] wasHydrated:', wasHydrated);
    
    this._appState.update(state => ({
      ...state,
      isHydrated: true
    }));
    console.log('🔧 [EAGER-INIT] Estado actualizado a isHydrated: true');

    // Solo ejecutar callback si no estaba hidratado antes
    if (!wasHydrated) {
      console.log('🔧 [EAGER-INIT] Ejecutando onHydrationComplete...');
      this.onHydrationComplete();
      console.log('🔧 [EAGER-INIT] onHydrationComplete completado');
    }
  }

  /**
   * Obtener datos del cache
   */
  getCacheItem<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    
    if (!cached) {
      this.updateCacheStats('misses');
      return null;
    }

    if (Date.now() > cached.timestamp + cached.ttl) {
      this.memoryCache.delete(key);
      this.updateCacheStats('misses');
      return null;
    }

    this.updateCacheStats('hits');
    return cached.data;
  }

  /**
   * Establecer datos en cache
   */
  setCacheItem<T>(key: string, data: T, ttl: number = this.cacheConfig.defaultTTL): void {
    // Limpiar cache si está lleno
    if (this.memoryCache.size >= this.cacheConfig.maxSize) {
      this.cleanExpiredCache();
      
              // Si aún está lleno, eliminar el item más antiguo
        if (this.memoryCache.size >= this.cacheConfig.maxSize) {
          const oldestKey = this.memoryCache.keys().next().value;
          if (oldestKey) {
            this.memoryCache.delete(oldestKey);
          }
        }
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    this.updateCacheStats('size', this.memoryCache.size);
  }

  /**
   * Limpiar cache expirado
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, value] of this.memoryCache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Actualizar estadísticas del cache
   */
  private updateCacheStats(type: 'hits' | 'misses' | 'size', value?: number): void {
    this._appState.update(state => ({
      ...state,
      cacheStats: {
        ...state.cacheStats,
        [type]: value !== undefined ? value : state.cacheStats[type] + 1
      }
    }));
  }

  /**
   * Obtener estadísticas de rendimiento
   */
  getPerformanceStats(): Observable<any> {
    const stats = {
      cacheHitRate: this.cacheStats().hits / (this.cacheStats().hits + this.cacheStats().misses) || 0,
      cacheSize: this.cacheStats().size,
      isInitialized: this.isInitialized(),
      isHydrated: this.isHydrated()
    };

    return of(stats);
  }

  /**
   * Limpiar cache manualmente
   */
  clearCache(): void {
    this.memoryCache.clear();
    this._appState.update(state => ({
      ...state,
      cacheStats: { hits: 0, misses: 0, size: 0 }
    }));
  }

  /**
   * Callback cuando la hidratación se completa
   */
  private onHydrationComplete(): void {
    console.log('🔧 [EAGER-INIT] onHydrationComplete iniciado');
    
    // Ejecutar tareas post-hidratación
    console.log('🔧 [EAGER-INIT] Ejecutando executePostHydrationTasks...');
    this.executePostHydrationTasks();
    console.log('🔧 [EAGER-INIT] onHydrationComplete completado');
  }

  /**
   * Ejecutar tareas después de la hidratación
   */
  private executePostHydrationTasks(): void {
    console.log('🔧 [EAGER-INIT] executePostHydrationTasks iniciado');
    
    // Tareas que requieren que la aplicación esté completamente hidratada
    setTimeout(() => {
      console.log('🔧 [EAGER-INIT] Timeout de post-hidratación ejecutándose...');
      
      // Pre-cargar datos adicionales
      console.log('🔧 [EAGER-INIT] Llamando preloadAdditionalData...');
      this.preloadAdditionalData();
      
      // Optimizar componentes de la UI
      console.log('🔧 [EAGER-INIT] Llamando optimizeUIComponents...');
      this.optimizeUIComponents();
      
      console.log('🔧 [EAGER-INIT] Timeout de post-hidratación completado');
    }, 1000);
    
    console.log('🔧 [EAGER-INIT] executePostHydrationTasks completado');
  }

  /**
   * Pre-cargar datos adicionales post-hidratación
   * DESHABILITADO: Puede causar problemas de carga
   */
  private async preloadAdditionalData(): Promise<void> {
    console.log('🔍 [CACHE] preloadAdditionalData DESHABILITADO');
    return;
    
    /* CÓDIGO ORIGINAL DESHABILITADO
    // Datos que no son críticos pero mejoran la experiencia
    const additionalData = [
      'estadisticasGenerales',
      'notificacionesPendientes',
      'configuracionTema'
    ];

    for (const key of additionalData) {
      try {
        const data = await this.http.get(`${environment.apiUrl}/additional/${key}`).toPromise();
        this.setCacheItem(key, data, 10 * 60 * 1000); // 10 minutos
      } catch (error) {
        // Ignorar errores de pre-carga adicional
      }
    }
    */
  }

  /**
   * Optimizar componentes de la UI
   */
  private optimizeUIComponents(): void {
    // Aplicar optimizaciones de rendimiento a componentes
    if (typeof window !== 'undefined') {
      // Lazy loading de imágenes
      this.setupLazyLoading();
      
      // Optimización de scroll
      this.optimizeScroll();
    }
  }

  /**
   * Configurar lazy loading de imágenes
   */
  private setupLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset['src'] || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Optimizar scroll para mejor rendimiento
   */
  private optimizeScroll(): void {
    let ticking = false;
    
    const updateScroll = () => {
      // Aplicar optimizaciones de scroll
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
  }
} 
