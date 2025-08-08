import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isHandling401 = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Agregar token de autorización si está disponible
    const token = this.authService.getToken();
    let modifiedRequest = request;

    if (token && this.authService.isTokenValid()) {
      modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isHandling401) {
          this.isHandling401 = true;
          console.log('Error 401 detectado en interceptor, redirigiendo al login...');
          this.authService.logout();
          
          // Usar setTimeout para evitar conflictos de navegación
          setTimeout(() => {
            this.router.navigate(['/login'], { replaceUrl: true });
            this.isHandling401 = false;
          }, 100);
        }
        return throwError(() => error);
      })
    );
  }
} 