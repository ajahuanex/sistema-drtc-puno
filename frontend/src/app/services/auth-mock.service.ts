import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthMockService {
  
  /**
   * Simular login con credenciales de prueba
   */
  mockLogin(credentials: LoginRequest): Observable<LoginResponse> {
    // console.log removed for production
    
    // Credenciales válidas para desarrollo
    const validCredentials = [
      { username: '12345678', password: 'admin123' },
      { username: 'admin', password: 'admin123' },
      { username: 'test', password: 'test123' }
    ];
    
    const isValidCredential = validCredentials.some(
      cred => cred.username === credentials.username && cred.password === credentials.password
    );
    
    if (!isValidCredential) {
      return throwError(() => ({
        status: 401,
        error: { detail: 'Credenciales incorrectas' }
      })).pipe(delay(1000));
    }
    
    // Generar token mock válido
    const mockToken = this.generateMockToken();
    
    // Usuario mock
    const mockUser = {
      id: 'mock-user-id-' + Date.now(),
      dni: credentials.username,
      nombres: 'Usuario',
      apellidos: 'De Prueba',
      email: 'usuario@test.com',
      rolId: 'admin-role'
    };
    
    const mockResponse: LoginResponse = {
      accessToken: mockToken,
      tokenType: 'Bearer',
      user: mockUser
    };
    
    // console.log removed for production
    
    return of(mockResponse).pipe(delay(1500)); // Simular latencia de red
  }
  
  /**
   * Generar un token mock válido para desarrollo
   */
  private generateMockToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'mock-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
      role: 'admin'
    }));
    const signature = btoa('mock-signature-' + Date.now());
    
    return `${header}.${payload}.${signature}`;
  }
  
  /**
   * Verificar si debemos usar el servicio mock
   */
  shouldUseMock(): boolean {
    // Usar mock si estamos en desarrollo y no hay backend disponible
    return true; // Por ahora siempre usar mock para desarrollo
  }
}