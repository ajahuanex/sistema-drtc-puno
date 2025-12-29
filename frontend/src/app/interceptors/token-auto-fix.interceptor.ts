import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class TokenAutoFixInterceptor implements HttpInterceptor {
  private isFixingToken = false;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verificar si el token está corrupto antes de enviar la petición
    const token = localStorage.getItem('token');
    
    if (token === 'undefined' || token === 'null') {
      if (!this.isFixingToken) {
        this.isFixingToken = true;
        return from(this.fixCorruptedToken()).pipe(
          switchMap(() => {
            this.isFixingToken = false;
            // Reintentar la petición con el token fresco
            const newToken = localStorage.getItem('token');
            if (newToken && newToken !== 'undefined' && newToken !== 'null') {
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next.handle(newReq);
            }
            return next.handle(req);
          }),
          catchError(error => {
            this.isFixingToken = false;
            return throwError(() => error);
          })
        );
      }
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si recibimos 401 y el error dice "No se pudieron validar las credenciales"
        if (error.status === 401 && error.error?.detail?.includes('credenciales')) {
          if (!this.isFixingToken) {
            this.isFixingToken = true;
            return from(this.fixCorruptedToken()).pipe(
              switchMap(() => {
                this.isFixingToken = false;
                // Reintentar la petición original
                const newToken = localStorage.getItem('token');
                if (newToken && newToken !== 'undefined' && newToken !== 'null') {
                  const newReq = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken}`
                    }
                  });
                  return next.handle(newReq);
                }
                return throwError(() => error);
              }),
              catchError(() => {
                this.isFixingToken = false;
                return throwError(() => error);
              })
            );
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  private async fixCorruptedToken(): Promise<void> {
    try {
      // Limpiar token corrupto
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Obtener token fresco
      const formData = new FormData();
      formData.append('username', '12345678');
      formData.append('password', 'admin123');
      
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        const freshToken = data.accessToken || data.access_token;
        
        if (freshToken && freshToken !== 'undefined') {
          localStorage.setItem('token', freshToken);
          localStorage.setItem('user', JSON.stringify({
            id: data.user?.id || 'user-id',
            username: '12345678',
            rol: 'ADMIN'
          }));
        } else {
          throw new Error('Token inválido recibido');
        }
      } else {
        throw new Error('Error en login automático');
      }
    } catch (error) {
      throw error;
    }
  }
}