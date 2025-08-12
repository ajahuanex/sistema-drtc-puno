import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router con lazy loading optimizado
    provideRouter(routes),
    
    // HTTP Client con fetch nativo y interceptores
    provideHttpClient(
      withFetch(), // Usar fetch nativo del navegador
      withInterceptors([authInterceptor])
    ),
    
    // Animaciones optimizadas
    provideAnimations(),
    
    // Hidratación del lado del cliente
    provideClientHydration(),
    
    // Configuración de Angular Material para fechas
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: {
      parse: {
        dateInput: 'DD/MM/YYYY',
      },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
      },
    }},
    
    // Configuración de inicialización eager
    {
      provide: 'APP_INITIALIZER',
      useValue: () => {
        // Registrar locale español para fechas
        registerLocaleData(localeEs, 'es');
        // Inicialización eager de servicios críticos
        return Promise.resolve();
      },
      multi: true
    }
  ]
};
