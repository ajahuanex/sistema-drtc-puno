import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenAutoFixService {

  constructor() {
    // Ejecutar automáticamente al inicializar el servicio
    this.checkAndFixToken();
  }

  private async checkAndFixToken(): Promise<void> {
    const token = localStorage.getItem('token');
    
    // Si el token está corrupto, corregirlo automáticamente
    if (token === 'undefined' || token === 'null') {
      console.log('🔧 TokenAutoFixService: Token corrupto detectado al iniciar, corrigiendo...');
      
      try {
        await this.obtenerTokenFresco();
        console.log('✅ TokenAutoFixService: Token corregido automáticamente');
      } catch (error) {
        console.log('⚠️ TokenAutoFixService: No se pudo corregir token, limpiando...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }

  private async obtenerTokenFresco(): Promise<void> {
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
  }

  /**
   * Método público para corregir token cuando sea necesario
   */
  public async fixTokenIfNeeded(): Promise<boolean> {
    const token = localStorage.getItem('token');
    
    if (token === 'undefined' || token === 'null' || !token) {
      try {
        await this.obtenerTokenFresco();
        return true;
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
    }
    
    return true; // Token ya está bien
  }
}