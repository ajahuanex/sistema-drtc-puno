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
      if (error.status === 401) {
        const currentUrl = router.url;
        const isLoginPage = currentUrl.includes('/login');
        const isAuthEndpoint = req.url.includes('/auth/');
        
        // Si no estamos en login y no es un endpoint de auth, intentar login automático
        if (!isLoginPage && !isAuthEndpoint) {
          // console.log removed for production
          
          return from(autoLoginService.performAutoLogin()).pipe(
            switchMap((success) => {
              if (success) {
                // Reintentar la petición original con el nuevo token
                const newToken = autoLoginService.getToken();
                if (newToken) {
                  const retryRequest = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken}`
                    }
                  });
                  // console.log removed for production
                  return next(retryRequest);
                }
              }
              
              // Si el login automático falla, redirigir a login
              // console.log removed for production
              authService.logout();
              router.navigate(['/login'], { replaceUrl: true });
              return throwError(() => error);
            }),
            catchError(() => {
              // Si hay error en el login automático, redirigir a login
              authService.logout();
              router.navigate(['/login'], { replaceUrl: true });
              return throwError(() => error);
            })
          );
        }
      }
      
      if (error.status === 403) {
        console.warn('⚠️ Error 403: Acceso prohibido');
        // Para errores 403, no redirigir, solo mostrar el error
        return throwError(() => error);
      }
      
      return throwError(() => error);
    })
  );
}; 