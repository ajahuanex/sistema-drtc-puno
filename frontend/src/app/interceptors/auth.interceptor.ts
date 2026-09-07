import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, from } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AutoLoginService } from '../services/auto-login.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const authService = inject(AuthService);
  const autoLoginService = inject(AutoLoginService);
  const router = inject(Router);

  const isExternalUrl = req.url.startsWith('http://') || req.url.startsWith('https://');
  const isGoogleSheets = req.url.includes('docs.google.com') || req.url.includes('google.com');

  // Agregar token de autorización solo a solicitudes internas a la API
  let modifiedRequest = req;
  const token = authService.getToken();

  if (!isGoogleSheets && (!isExternalUrl || req.url.includes('/api/')) && token && token !== 'undefined' && token !== 'null') {
    modifiedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es de un servicio externo como Google Sheets, no cerrar sesión
      if (isGoogleSheets || (isExternalUrl && !req.url.includes('/api/'))) {
        console.warn('⚠️ Error HTTP en servicio externo (ignorado para auth):', req.url, error.status);
        return throwError(() => error);
      }

      console.log('🔴 HTTP Error interceptado:', {
        status: error.status,
        url: req.url,
        message: error.message
      });
      
      if (error.status === 401) {
        const currentUrl = router.url;
        const isLoginPage = currentUrl.includes('/login');
        const isAuthEndpoint = req.url.includes('/auth/');
        
        console.log('🔴 Error 401 - No autorizado:', {
          currentUrl,
          isLoginPage,
          isAuthEndpoint,
          requestUrl: req.url
        });
        
        console.log('❌ Error 401 detectado en API de aplicación, redirigiendo a login');
        authService.logout();
        router.navigate(['/login'], { replaceUrl: true });
        return throwError(() => error);
      }
      
      if (error.status === 403) {
        console.warn('⚠️ Error 403: Acceso prohibido');
        return throwError(() => error);
      }
      
      return throwError(() => error);
    })
  );
}; 