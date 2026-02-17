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

  // Agregar token de autorización si está disponible
  let modifiedRequest = req;
  const token = authService.getToken();

  if (token && token !== 'undefined' && token !== 'null') {
    modifiedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
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
        
        // TEMPORALMENTE DESHABILITADO: No hacer auto-login, solo redirigir
        console.log('❌ Error 401 detectado, redirigiendo a login SIN auto-login');
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