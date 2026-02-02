import { Injectable } from '@angular/core';
import { AutoLoginService } from './auto-login.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {

  constructor(private autoLoginService: AutoLoginService) {}

  /**
   * Inicializa la aplicación asegurando que haya autenticación válida
   */
  async initialize(): Promise<void> {
    try {
      // console.log removed for production
      
      // Verificar y asegurar autenticación
      const isAuthenticated = await this.autoLoginService.ensureAuthenticated();
      
      if (isAuthenticated) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación::', error);
      // No lanzar error para no bloquear la aplicación
    }
  }
}