import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import 'zone.js';

// Configuración de hidratación y optimizaciones
const bootstrapConfig = {
  ...appConfig,
  providers: [
    ...appConfig.providers || [],
    // Configuración para hidratación
    { provide: 'APP_INITIALIZER', useValue: () => Promise.resolve(), multi: true }
  ]
};

// Función de inicialización eager con Signals
async function initializeApp() {
  // Pre-cargar datos críticos antes del bootstrap
  if (typeof window !== 'undefined') {
    // Client-side optimizations
    await preloadCriticalData();
  }
  
  return bootstrapApplication(AppComponent, bootstrapConfig);
}

// Pre-carga de datos críticos
async function preloadCriticalData() {
  try {
    // Por ahora, usar configuración por defecto
    // En el futuro, aquí se puede hacer la llamada HTTP real
    const defaultConfig = {
      apiUrl: window.location.origin,
      environment: 'development',
      features: ['empresas', 'vehiculos', 'conductores', 'resoluciones', 'rutas'],
      cacheConfig: {
        ttl: 300000, // 5 minutos
        maxSize: 100
      }
    };
    
    // Almacenar en sessionStorage para acceso rápido
    sessionStorage.setItem('criticalConfig', JSON.stringify(defaultConfig));
  } catch (error) {
    console.warn('Error preloading critical data:', error);
  }
}

// Inicializar la aplicación
initializeApp().catch(err => console.error('Error starting app:', err));
