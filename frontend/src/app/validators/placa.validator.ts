import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador personalizado para formato de placa vehicular
 * Formato esperado: A2B-123 (alfanumérico-numérico)
 * Mínimo: 3 caracteres alfanuméricos + 3 dígitos
 */
export function placaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Si está vacío, lo maneja el validator 'required'
    }

    const value = control.value.toString().trim().toUpperCase();
    
    // Remover guión si existe para validar
    const sinGuion = value.replace('-', '');
    
    // Validar longitud mínima (6 caracteres: 3 alfanuméricos + 3 numéricos)
    if (sinGuion.length < 6) {
      return { 
        placaInvalida: { 
          message: 'La placa debe tener al menos 6 caracteres (ej: ABC-123)' 
        } 
      };
    }

    // Validar longitud máxima (8 caracteres sin guión)
    if (sinGuion.length > 8) {
      return { 
        placaInvalida: { 
          message: 'La placa no puede tener más de 8 caracteres' 
        } 
      };
    }

    // Validar que tenga al menos 3 caracteres alfanuméricos al inicio
    const parteAlfanumerica = sinGuion.match(/^[A-Z0-9]{3,}/);
    if (!parteAlfanumerica) {
      return { 
        placaInvalida: { 
          message: 'La placa debe empezar con al menos 3 caracteres alfanuméricos' 
        } 
      };
    }

    // Validar que termine con al menos 3 dígitos
    const parteNumerica = sinGuion.match(/\d{3,}$/);
    if (!parteNumerica) {
      return { 
        placaInvalida: { 
          message: 'La placa debe terminar con al menos 3 dígitos' 
        } 
      };
    }

    // Validar formato completo: alfanuméricos + numéricos
    const formatoValido = /^[A-Z0-9]{3,5}\d{3}$/.test(sinGuion);
    if (!formatoValido) {
      return { 
        placaInvalida: { 
          message: 'Formato inválido. Use: ABC-123 o A2B-123' 
        } 
      };
    }

    return null; // Válido
  };
}

/**
 * Formatea una placa al formato estándar: XXX-123
 * Ejemplos:
 * - "abc123" → "ABC-123"
 * - "a2b456" → "A2B-456"
 * - "ABC-123" → "ABC-123" (ya formateada)
 */
export function formatearPlaca(placa: string): string {
  if (!placa) return '';

  // Limpiar y convertir a mayúsculas
  let limpia = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Si ya tiene el formato correcto, retornar
  if (/^[A-Z0-9]{3,5}-\d{3}$/.test(placa.toUpperCase())) {
    return placa.toUpperCase();
  }

  // Validar longitud mínima
  if (limpia.length < 6) {
    return limpia; // Retornar sin formatear si es muy corta
  }

  // Separar parte alfanumérica y numérica
  // Buscar los últimos 3 dígitos
  const match = limpia.match(/^([A-Z0-9]+?)(\d{3})$/);
  
  if (match) {
    const parteAlfanumerica = match[1];
    const parteNumerica = match[2];
    
    // Validar que la parte alfanumérica tenga al menos 3 caracteres
    if (parteAlfanumerica.length >= 3) {
      return `${parteAlfanumerica}-${parteNumerica}`;
    }
  }

  // Si no se puede formatear correctamente, retornar limpia
  return limpia;
}

/**
 * Ejemplos de uso:
 * 
 * Válidos:
 * - "ABC123" → "ABC-123" ✓
 * - "abc123" → "ABC-123" ✓
 * - "A2B456" → "A2B-456" ✓
 * - "XYZ789" → "XYZ-789" ✓
 * - "ABCD123" → "ABCD-123" ✓
 * 
 * Inválidos:
 * - "AS123" → Error (solo 2 caracteres alfanuméricos)
 * - "AB12" → Error (solo 2 dígitos)
 * - "A1" → Error (muy corto)
 * - "123ABC" → Error (empieza con números)
 */
