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
    // Inicialización automática (solo una vez)
    this.initializeApp();
  }

  /**
   * Inicialización eager de la aplicación
   */
  async initializeApp(): Promise<void> {
    try {
      // 1. Cargar configuración crítica
      await this.loadCriticalConfig();
      
      // 2. Pre-cargar datos esenciales
      await this.preloadEssentialData();
      
      // 3. Inicializar cache y preferencias
      await this.initializeCache();
      
      // 4. Marcar como inicializado
      this._appState.update(state => ({
        ...state,
        isInitialized: true
      }));
      
      this._initializationStatus$.next(true);
      
      // console.log removed for production
      
    } catch (error) {
      console.error('❌ Error en inicialización eager::', error);
      // Fallback a configuración por defecto
      this.setDefaultConfig();
    }
  }

  /**
   * Cargar configuración crítica
   */
  private async loadCriticalConfig(): Promise<void> {
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
  }

  /**
   * Pre-cargar datos esenciales
   */
  private async preloadEssentialData(): Promise<void> {
    const preloadTasks = [
      this.preloadUserPreferences(),
      this.preloadCommonData(),
      this.preloadUIComponents()
      // Removemos preloadConfiguraciones() ya que se carga automáticamente en el servicio
    ];

    await Promise.allSettled(preloadTasks);
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
   */
  private async preloadCommonData(): Promise<void> {
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
    const wasHydrated = this._appState().isHydrated;
    
    this._appState.update(state => ({
      ...state,
      isHydrated: true
    }));

    // Solo ejecutar callback si no estaba hidratado antes
    if (!wasHydrated) {
      this.onHydrationComplete();
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
    // console.log removed for production
    
    // Ejecutar tareas post-hidratación
    this.executePostHydrationTasks();
  }

  /**
   * Ejecutar tareas después de la hidratación
   */
  private executePostHydrationTasks(): void {
    // Tareas que requieren que la aplicación esté completamente hidratada
    setTimeout(() => {
      // Pre-cargar datos adicionales
      this.preloadAdditionalData();
      
      // Optimizar componentes de la UI
      this.optimizeUIComponents();
    }, 1000);
  }

  /**
   * Pre-cargar datos adicionales post-hidratación
   */
  private async preloadAdditionalData(): Promise<void> {
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
