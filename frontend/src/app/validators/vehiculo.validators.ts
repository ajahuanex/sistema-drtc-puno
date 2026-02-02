import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { VehiculoConsolidadoService } from '../services/vehiculo-consolidado.service';

/**
 * Validador para formato de placa peruana
 * Formato válido: XXX-123 (3 alfanuméricos, guión, 3 números)
 */
export function placaPeruanaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // No validar si está vacío (usar required para eso)
    }

    const placa = control.value.toUpperCase().trim();
    
    // Formato específico: XXX-123 (3 alfanuméricos, guión, 3 números)
    const formatoValido = /^[A-Z0-9]{3}-\d{3}$/;
    
    if (!formatoValido.test(placa)) {
      return {
        placaInvalida: {
          value: control.value,
          message: 'Formato de placa inválido. Use XXX-123 (3 alfanuméricos-guión-3números)'
        }
      };
    }

    return null;
  };
}

/**
 * Validador asíncrono para verificar duplicados de placa
 */
export function placaDuplicadaValidator(
  vehiculoService: VehiculoConsolidadoService | any,
  vehiculoIdActual?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    const placa = control.value.toUpperCase().trim();

    // Debounce de 500ms para evitar muchas peticiones
    return timer(500).pipe(
      switchMap(() => {
        // Verificar si el servicio tiene el método verificarPlacaDisponible
        if (vehiculoService.verificarPlacaDisponible) {
          return vehiculoService.verificarPlacaDisponible(placa, vehiculoIdActual);
        } else {
          // Fallback para compatibilidad con servicio legacy
          return of(true);
        }
      }),
      map(disponible => {
        return disponible ? null : {
          placaDuplicada: {
            value: placa,
            message: 'Esta placa ya está registrada en el sistema'
          }
        };
      }),
      catchError(() => of(null)) // En caso de error, no bloquear el formulario
    );
  };
}

/**
 * Validador para año de fabricación
 */
export function anioFabricacionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const anio = parseInt(control.value, 10);
    const anioActual = new Date().getFullYear();
    const anioMinimo = 1990;
    const anioMaximo = anioActual + 1; // Permitir año siguiente para vehículos nuevos

    if (isNaN(anio)) {
      return {
        anioInvalido: {
          value: control.value,
          message: 'El año debe ser un número válido'
        }
      };
    }

    if (anio < anioMinimo) {
      return {
        anioMinimo: {
          value: anio,
          minimo: anioMinimo,
          message: `El año mínimo permitido es ${anioMinimo}`
        }
      };
    }

    if (anio > anioMaximo) {
      return {
        anioMaximo: {
          value: anio,
          maximo: anioMaximo,
          message: `El año máximo permitido es ${anioMaximo}`
        }
      };
    }

    return null;
  };
}

/**
 * Validador para capacidad de pasajeros
 */
export function capacidadPasajerosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const capacidad = parseInt(control.value, 10);

    if (isNaN(capacidad)) {
      return {
        capacidadInvalida: {
          value: control.value,
          message: 'La capacidad debe ser un número válido'
        }
      };
    }

    if (capacidad < 1) {
      return {
        capacidadMinima: {
          value: capacidad,
          minimo: 1,
          message: 'La capacidad mínima es 1 pasajero'
        }
      };
    }

    if (capacidad > 100) {
      return {
        capacidadMaxima: {
          value: capacidad,
          maximo: 100,
          message: 'La capacidad máxima es 100 pasajeros'
        }
      };
    }

    return null;
  };
}

/**
 * Validador para número de motor
 */
export function numeroMotorValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const numeroMotor = control.value.trim();

    // Debe tener al menos 6 caracteres alfanuméricos
    if (numeroMotor.length < 6) {
      return {
        numeroMotorCorto: {
          value: numeroMotor,
          message: 'El número de motor debe tener al menos 6 caracteres'
        }
      };
    }

    // Solo debe contener letras, números y guiones
    const formatoValido = /^[A-Z0-9-]+$/i.test(numeroMotor);
    if (!formatoValido) {
      return {
        numeroMotorInvalido: {
          value: numeroMotor,
          message: 'El número de motor solo puede contener letras, números y guiones'
        }
      };
    }

    return null;
  };
}

/**
 * Validador para número de chasis
 */
export function numeroChasisValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const numeroChasis = control.value.trim();

    // Debe tener al menos 6 caracteres alfanuméricos
    if (numeroChasis.length < 6) {
      return {
        numeroChasisCorto: {
          value: numeroChasis,
          message: 'El número de chasis debe tener al menos 6 caracteres'
        }
      };
    }

    // Solo debe contener letras, números y guiones
    const formatoValido = /^[A-Z0-9-]+$/i.test(numeroChasis);
    if (!formatoValido) {
      return {
        numeroChasisInvalido: {
          value: numeroChasis,
          message: 'El número de chasis solo puede contener letras, números y guiones'
        }
      };
    }

    return null;
  };
}

/**
 * Validador para número de TUC
 */
export function numeroTucValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const numeroTuc = control.value.trim();

    // Formato típico: T-123456-2025 o similar
    const formatoValido = /^[A-Z]-\d{6}-\d{4}$/i.test(numeroTuc);
    
    if (!formatoValido) {
      return {
        numeroTucInvalido: {
          value: numeroTuc,
          message: 'Formato de TUC inválido. Use T-123456-2025'
        }
      };
    }

    return null;
  };
}
