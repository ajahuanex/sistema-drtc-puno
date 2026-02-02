import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AutoLoginService {
  private apiUrl = environment.apiUrl;
  private isAutoLoggingIn = false;
  private autoLoginSubject = new BehaviorSubject<boolean>(false);
  public autoLoginStatus$ = this.autoLoginSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Realiza login automático con credenciales por defecto
   */
  async performAutoLogin(): Promise<boolean> {
    if (this.isAutoLoggingIn) {
      return false;
    }

    try {
      this.isAutoLoggingIn = true;
      this.autoLoginSubject.next(true);

      // console.log removed for production

      // Limpiar tokens corruptos
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Preparar datos de login
      const formData = new FormData();
      formData.append('username', '12345678');
      formData.append('password', 'admin123');
      formData.append('grant_type', 'password');

      // Realizar login
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.access_token;

        if (token && token !== 'undefined' && token !== 'null') {
          // Guardar token y usuario
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify({
            id: data.user?.id || 'auto-user',
            dni: '12345678',
            nombres: data.user?.nombres || 'Usuario',
            apellidos: data.user?.apellidos || 'Automático',
            email: data.user?.email || 'auto@sistema.com',
            rolId: data.user?.rolId || 'administrador',
            estaActivo: true,
            fechaCreacion: new Date().toISOString()
          }));

          // console.log removed for production
          this.autoLoginSubject.next(false);
          this.isAutoLoggingIn = false;
          return true;
        } else {
          throw new Error('Token inválido recibido');
        }
      } else {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('❌ Error en login automático::', error);
      this.autoLoginSubject.next(false);
      this.isAutoLoggingIn = false;
      return false;
    }
  }

  /**
   * Verifica si el token actual es válido
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    
    if (!token || token === 'undefined' || token === 'null') {
      return false;
    }

    // Verificar si es un JWT válido
    if (!token.includes('.') || token.split('.').length !== 3) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Verifica y corrige el estado de autenticación
   */
  async ensureAuthenticated(): Promise<boolean> {
    if (this.isTokenValid()) {
      return true;
    }

    // console.log removed for production
    return await this.performAutoLogin();
  }
}