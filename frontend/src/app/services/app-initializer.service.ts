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
      console.log('🚀 Inicializando aplicación SIRRET...');
      
      // Verificar y asegurar autenticación
      const isAuthenticated = await this.autoLoginService.ensureAuthenticated();
      
      if (isAuthenticated) {
        console.log('✅ Aplicación inicializada con autenticación válida');
      } else {
        console.log('⚠️ Aplicación inicializada sin autenticación');
      }
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      // No lanzar error para no bloquear la aplicación
    }
  }
}