import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Agregar token de autorización si está disponible
  let modifiedRequest = req;
  const token = authService.getToken();

  if (token) {
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
        
        // Solo redirigir si no estamos ya en login y no es un endpoint de auth
        if (!isLoginPage && !isAuthEndpoint) {
          authService.logout();
          router.navigate(['/login'], { replaceUrl: true });
        }
      }
      return throwError(() => error);
    })
  );
}; 