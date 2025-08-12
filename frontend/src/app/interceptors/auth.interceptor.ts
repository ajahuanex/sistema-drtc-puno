import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  let isHandling401 = false;

  // Agregar token de autorización si está disponible
  let modifiedRequest = req;
  const token = authService.getToken();

  if (token && authService.isTokenValid()) {
    modifiedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isHandling401) {
        isHandling401 = true;
        console.log('Error 401 detectado en interceptor, redirigiendo al login...');
        authService.logout();
        
        // Usar setTimeout para evitar conflictos de navegación
        setTimeout(() => {
          router.navigate(['/login'], { replaceUrl: true });
          isHandling401 = false;
        }, 100);
      }
      return throwError(() => error);
    })
  );
}; 