import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, map } from 'rxjs';
import { Usuario, LoginRequest, LoginResponse, UsuarioCreate } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { AuthMockService } from './auth-mock.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private authMockService: AuthMockService) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        this.currentUserSubject.next(parsedUser);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');

    return this.http.post<any>(`${this.apiUrl}/auth/login`, formData).pipe(
      map(response => {
        // Transformar respuesta del backend al formato esperado por el frontend
        return {
          accessToken: response.access_token,
          tokenType: response.token_type || 'Bearer',
          user: {
            id: response.user?.id || '1',
            dni: credentials.username,
            nombres: response.user?.nombres || 'Usuario',
            apellidos: response.user?.apellidos || 'Sistema',
            email: response.user?.email || `${credentials.username}@sistema.com`,
            rolId: response.user?.rolId || 'administrador'
          }
        } as LoginResponse;
      }),
      tap(response => {
        this.handleLoginResponse(response);
      }),
      catchError(error => {
        console.error('Error en login:', error);
        throw error;
      })
    );
  }

  private handleLoginResponse(response: LoginResponse): void {
    if (response.accessToken && response.user) {
      localStorage.setItem('token', response.accessToken);
      
      // Crear objeto Usuario completo
      const usuario: Usuario = {
        id: response.user.id,
        dni: response.user.dni,
        nombres: response.user.nombres,
        apellidos: response.user.apellidos,
        email: response.user.email,
        rolId: response.user.rolId,
        estaActivo: true,
        fechaCreacion: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(usuario));
      this.currentUserSubject.next(usuario);
    }
  }

  register(userData: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<LoginResponse> {
    const token = this.getToken();
    if (!token) {
      return new Observable(subscriber => {
        subscriber.error(new Error('No hay token para refrescar'));
      });
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, { token }).pipe(
      tap(response => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user as Usuario);
      })
    );
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = this.getToken();
    return !!(user && token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    // Si no es un JWT válido, asumir que no está expirado
    if (!token.includes('.') || token.split('.').length !== 3) {
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() >= expirationTime;
    } catch (error) {
      return false;
    }
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return { 'Content-Type': 'application/json' };
  }
} 
