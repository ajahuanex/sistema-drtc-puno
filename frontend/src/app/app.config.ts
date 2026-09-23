import { GlobalErrorHandler } from './services/global-error-handler.service';
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ReactiveFormsModule } from '@angular/forms';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { TokenAutoFixInterceptor } from './interceptors/token-auto-fix.interceptor';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { TokenAutoFixService } from './services/token-auto-fix.service';
import { IconService } from './services/icon.service';


export const appConfig: ApplicationConfig = {
  providers: [
    // Configuración global de formularios Material: etiquetas siempre en el notch, altura compacta dinámica
    { 
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, 
      useValue: { 
        appearance: 'outline',
        subscriptSizing: 'dynamic',
        floatLabel: 'always'
      } 
    },
    // Router con lazy loading optimizado
    provideRouter(routes),
    
    // HTTP Client con fetch nativo y interceptores
    provideHttpClient(
      withFetch(), // Usar fetch nativo del navegador
      withInterceptors([authInterceptor])
    ),
    
    // Animaciones optimizadas
    provideAnimations(),
    

    

    
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
    
    // IconService - Servicio de iconos con fallbacks automáticos
    IconService,
    
    // TokenAutoFixService - Servicio para corregir tokens corruptos automáticamente
    // TokenAutoFixService, // DESHABILITADO TEMPORALMENTE PARA EVITAR BUCLES
    
    // Configuración de inicialización eager
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        return () => {
          console.log('🔧 [APP_INITIALIZER] Registrando locale español...');
          registerLocaleData(localeEs, 'es');
          return Promise.resolve(true);
        };
      },
      multi: true
    }
  ]
};
