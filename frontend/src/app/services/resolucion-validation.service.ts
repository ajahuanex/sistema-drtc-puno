import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ResolucionService } from './resolucion.service';
import { Resolucion } from '../models/resolucion.model';

export interface ValidacionResolucion {
  numero: string;
  año: number;
  empresaId?: string;
  resolucionIdExcluir?: string; // Para edición: excluir la resolución actual
}

export interface ResultadoValidacion {
  valido: boolean;
  mensaje: string;
  resolucionExistente?: {
    id: string;
    nroResolucion: string;
    empresaId: string;
    estado: string;
    fechaEmision: Date;
  };
  conflictos?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ResolucionValidationService {

  constructor(private resolucionService: ResolucionService) {}

  /**
   * Valida que el número de resolución sea único por año
   * @param validacion Datos de validación
   * @returns Observable con el resultado de la validación
   */
  validarUnicidadResolucion(validacion: ValidacionResolucion): Observable<ResultadoValidacion> {
    return this.resolucionService.getResoluciones().pipe(
      map(resoluciones => this.validarUnicidadLocal(resoluciones, validacion)),
      catchError(error => {
        console.error('Error al validar unicidad de resolución::', error);
        return of({
          valido: false,
          mensaje: 'Error al validar la unicidad de la resolución. Intente nuevamente.',
          conflictos: ['Error de conexión con el servidor']
        });
      })
    );
  }

  /**
   * Valida la unicidad localmente usando los datos mock
   */
  private validarUnicidadLocal(resoluciones: Resolucion[], validacion: ValidacionResolucion): ResultadoValidacion {
    const { numero, año, empresaId, resolucionIdExcluir } = validacion;
    
    // Validar formato del número
    if (!this.validarFormatoNumero(numero)) {
      return {
        valido: false,
        mensaje: 'El número de resolución debe ser un número válido mayor a 0',
        conflictos: ['Formato de número inválido']
      };
    }

    // Validar año
    if (!this.validarAño(año)) {
      return {
        valido: false,
        mensaje: 'El año debe ser válido y no puede ser mayor al año actual',
        conflictos: ['Año inválido']
      };
    }

    // Buscar resoluciones existentes con el mismo número en el mismo año
    const resolucionesConflictivas = resoluciones.filter(resolucion => {
      // Excluir la resolución actual si estamos editando
      if (resolucionIdExcluir && resolucion.id === resolucionIdExcluir) {
        return false;
      }

      // Extraer número y año de la resolución existente
      const match = resolucion.nroResolucion.match(/^R-(\d+)-(\d+)$/);
      if (!match) return false;

      const numeroExistente = match[1];
      const añoExistente = parseInt(match[2]);

      // Verificar si hay conflicto
      return numeroExistente === numero && añoExistente === año;
    });

    if (resolucionesConflictivas.length > 0) {
      const resolucionConflictiva = resolucionesConflictivas[0];
      
      return {
        valido: false,
        mensaje: `Ya existe una resolución con el número ${numero} en el año ${año}`,
        resolucionExistente: {
          id: resolucionConflictiva.id,
          nroResolucion: resolucionConflictiva.nroResolucion,
          empresaId: resolucionConflictiva.empresaId,
          estado: resolucionConflictiva.estado || 'VIGENTE',
          fechaEmision: resolucionConflictiva.fechaEmision
        },
        conflictos: [
          `Resolución ${resolucionConflictiva.nroResolucion} ya existe`,
          `Empresa ID: ${resolucionConflictiva.empresaId}`,
          `Estado: ${resolucionConflictiva.estado || 'VIGENTE'}`,
          `Fecha de emisión: ${resolucionConflictiva.fechaEmision.toLocaleDateString('es-ES')}`
        ]
      };
    }

    // Si se especifica empresaId, verificar que no haya conflictos específicos de empresa
    if (empresaId) {
      const conflictosEmpresa = this.validarConflictosEmpresa(resoluciones, validacion);
      if (conflictosEmpresa.length > 0) {
        return {
          valido: false,
          mensaje: 'Existen conflictos con otras resoluciones de la misma empresa',
          conflictos: conflictosEmpresa
        };
      }
    }

    return {
      valido: true,
      mensaje: `El número de resolución ${numero} está disponible para el año ${año}`
    };
  }

  /**
   * Valida el formato del número de resolución
   */
  private validarFormatoNumero(numero: string): boolean {
    const numeroInt = parseInt(numero);
    return !isNaN(numeroInt) && numeroInt > 0;
  }

  /**
   * Valida el año de la resolución
   */
  private validarAño(año: number): boolean {
    const añoActual = new Date().getFullYear();
    return año >= 2000 && año <= añoActual + 1; // Permitir hasta el año siguiente
  }

  /**
   * Valida conflictos específicos de empresa
   */
  private validarConflictosEmpresa(resoluciones: Resolucion[], validacion: ValidacionResolucion): string[] {
    const { numero, año, empresaId, resolucionIdExcluir } = validacion;
    const conflictos: string[] = [];

    // Buscar resoluciones de la misma empresa en el mismo año
    const resolucionesEmpresa = resoluciones.filter(resolucion => {
      if (resolucionIdExcluir && resolucion.id === resolucionIdExcluir) {
        return false;
      }
      return resolucion.empresaId === empresaId;
    });

    // Verificar si hay resoluciones del mismo tipo en el mismo año
    resolucionesEmpresa.forEach(resolucion => {
      const match = resolucion.nroResolucion.match(/^R-(\d+)-(\d+)$/);
      if (match) {
        const añoExistente = parseInt(match[2]);
        if (añoExistente === año) {
          conflictos.push(`La empresa ya tiene una resolución en el año ${año}: ${resolucion.nroResolucion}`);
        }
      }
    });

    return conflictos;
  }

  /**
   * Genera el número completo de resolución
   */
  generarNumeroResolucion(numero: string, año: number): string {
    const numeroFormateado = numero.padStart(4, '0');
    return `R-${numeroFormateado}-${año}`;
  }

  /**
   * Valida que el número de resolución no esté en uso por otra empresa
   */
  validarDisponibilidadGlobal(numero: string, año: number): Observable<boolean> {
    return this.resolucionService.getResoluciones().pipe(
      map(resoluciones => {
        const numeroFormateado = numero.padStart(4, '0');
        const nroResolucion = `R-${numeroFormateado}-${año}`;
        
        return !resoluciones.some(resolucion => 
          resolucion.nroResolucion === nroResolucion
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Obtiene sugerencias de números disponibles para un año específico
   */
  obtenerSugerenciasNumeros(año: number, cantidad: number = 5): Observable<string[]> {
    return this.resolucionService.getResoluciones().pipe(
      map(resoluciones => {
        const numerosUsados = new Set<string>();
        
        // Extraer números usados en el año específico
        resoluciones.forEach(resolucion => {
          const match = resolucion.nroResolucion.match(/^R-(\d+)-(\d+)$/);
          if (match && parseInt(match[2]) === año) {
            numerosUsados.add(match[1]);
          }
        });

        // Generar sugerencias
        const sugerencias: string[] = [];
        let numero = 1;
        
        while (sugerencias.length < cantidad) {
          const numeroStr = numero.toString();
          if (!numerosUsados.has(numeroStr)) {
            sugerencias.push(numeroStr);
          }
          numero++;
        }

        return sugerencias;
      }),
      catchError(() => of(['1', '2', '3', '4', '5']))
    );
  }

  /**
   * Valida la secuencia de resoluciones para una empresa
   */
  validarSecuenciaEmpresa(empresaId: string, año: number): Observable<ResultadoValidacion> {
    return this.resolucionService.getResoluciones().pipe(
      map(resoluciones => {
        const resolucionesEmpresa = resoluciones.filter(resolucion => 
          resolucion.empresaId === empresaId
        );

        const resolucionesAño = resolucionesEmpresa.filter(resolucion => {
          const match = resolucion.nroResolucion.match(/^R-(\d+)-(\d+)$/);
          return match && parseInt(match[2]) === año;
        });

        if (resolucionesAño.length === 0) {
          return {
            valido: true,
            mensaje: `No hay resoluciones previas para la empresa en el año ${año}`
          };
        }

        // Verificar secuencia
        const numeros = resolucionesAño.map(resolucion => {
          const match = resolucion.nroResolucion.match(/^R-(\d+)-(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        }).sort((a, b) => a - b);

        const siguienteNumero = numeros[numeros.length - 1] + 1;
        
        return {
          valido: true,
          mensaje: `Siguiente número sugerido: ${siguienteNumero}`,
          conflictos: [`Última resolución del año: R-${numeros[numeros.length - 1].toString().padStart(4, '0')}-${año}`]
        };
      }),
      catchError(() => of({
        valido: false,
        mensaje: 'Error al validar la secuencia de resoluciones',
        conflictos: ['Error de conexión']
      }))
    );
  }
}
