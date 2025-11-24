import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Usuario, LoginRequest, LoginResponse, UsuarioCreate } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, formData).pipe(
      tap(response => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user as Usuario);
      })
    );
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

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = this.getToken();
    
    if (!user || !token) {
      return false;
    }
    
    // Verificar si el token es válido
    if (!this.isTokenValid()) {
      console.log('Token inválido o expirado, limpiando...');
      this.logout();
      return false;
    }
    
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    // Verificar si el token tiene el formato JWT (3 partes separadas por puntos)
    if (!token.includes('.') || token.split('.').length !== 3) {
      // Si no es un JWT válido, asumir que es un token mock y no está expirado
      console.log('Token no es JWT válido, asumiendo token mock');
      return false;
    }
    
    try {
      // Decodificar el token JWT para verificar la expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('Error decodificando token:', error);
      // Si hay error decodificando, asumir que es un token mock
      console.log('Error decodificando JWT, asumiendo token mock');
      return false;
    }
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Para tokens mock, simplemente verificar que existan
    if (!token.includes('.') || token.split('.').length !== 3) {
      return true; // Token mock válido
    }
    
    // Para JWT reales, verificar expiración
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch (error) {
      console.log('Error verificando JWT, asumiendo token mock válido');
      return true;
    }
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    if (token && this.isTokenValid()) {
      return { 'Authorization': `Bearer ${token}` };
    } else {
      // Limpiar token inválido
      if (token && !this.isTokenValid()) {
        console.log('Token inválido, limpiando...');
        this.logout();
      }
      // Devolver headers básicos cuando no hay token válido
      return { 'Content-Type': 'application/json' };
    }
  }
} 
