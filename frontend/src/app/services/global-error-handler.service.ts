import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Error global capturado:', error);
    
    // Aquí puedes agregar lógica adicional como:
    // - Enviar errores a un servicio de logging
    // - Mostrar notificaciones al usuario
    // - Reintentar operaciones fallidas
    
    // Por ahora, solo logueamos el error
    if (error?.message) {
      console.error('Mensaje:', error.message);
    }
    
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}