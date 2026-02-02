import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ExpedienteService } from './expediente.service';
import { Expediente } from '../models/expediente.model';
import { environment } from '../../environments/environment';

export interface ValidacionExpediente {
  numero: string;
  año: number;
  empresaId?: string;
  expedienteIdExcluir?: string; // Para edición: excluir el expediente actual
}

export interface ResultadoValidacionExpediente {
  valido: boolean;
  mensaje: string;
  expedienteExistente?: {
    id: string;
    nroExpediente: string;
    empresaId?: string;
    estado: string;
    fechaEmision: Date;
    tipoTramite: string;
  };
  conflictos?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ExpedienteValidationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/expedientes';

  constructor(private expedienteService: ExpedienteService) {}

  /**
   * Valida que el número de expediente sea único por año
   * @param validacion Datos de validación
   * @returns Observable con el resultado de la validación
   */
  validarUnicidadExpediente(validacion: ValidacionExpediente): Observable<ResultadoValidacionExpediente> {
    const { numero, año, empresaId, expedienteIdExcluir } = validacion;
    
    // Construir parámetros de consulta
    let params = `numero=${numero}&anio=${año}`;
    if (empresaId) {
      params += `&empresaId=${empresaId}`;
    }
    if (expedienteIdExcluir) {
      params += `&expedienteIdExcluir=${expedienteIdExcluir}`;
    }
    
    // Llamar al endpoint de validación del backend
    const url = `${this.apiUrl}/validar/numero?${params}`;
    
    return this.http.get<ResultadoValidacionExpediente>(url).pipe(
      catchError(error => {
        console.error('Error al validar unicidad de expediente::', error);
        return of({
          valido: false,
          mensaje: 'Error al validar la unicidad del expediente. Intente nuevamente.',
          conflictos: ['Error de conexión con el servidor']
        });
      })
    );
  }

  /**
   * Valida la unicidad localmente usando los datos mock
   */
  private validarUnicidadLocal(expedientes: Expediente[], validacion: ValidacionExpediente): ResultadoValidacionExpediente {
    const { numero, año, empresaId, expedienteIdExcluir } = validacion;
    
    // Validar formato del número
    if (!this.validarFormatoNumero(numero)) {
      return {
        valido: false,
        mensaje: 'El número de expediente debe ser un número válido mayor a 0',
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

    // Formatear el número de entrada con padding
    const numeroFormateado = numero.padStart(4, '0');
    
    // Buscar expedientes existentes con el mismo número en el mismo año
    const expedientesConflictivos = expedientes.filter(expediente => {
      // Excluir el expediente actual si estamos editando
      if (expedienteIdExcluir && expediente.id === expedienteIdExcluir) {
        return false;
      }

      // Extraer número y año del expediente existente
      const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
      if (!match) return false;

      const numeroExistente = match[1];
      const añoExistente = parseInt(match[2]);

      // Verificar si hay conflicto (comparar con formato)
      return numeroExistente === numeroFormateado && añoExistente === año;
    });

    if (expedientesConflictivos.length > 0) {
      const expedienteConflictivo = expedientesConflictivos[0];
      
      return {
        valido: false,
        mensaje: `Ya existe un expediente con el número ${numero} en el año ${año}`,
        expedienteExistente: {
          id: expedienteConflictivo.id,
          nroExpediente: expedienteConflictivo.nroExpediente,
          empresaId: expedienteConflictivo.empresaId,
          estado: expedienteConflictivo.estado || 'EN_TRAMITE',
          fechaEmision: expedienteConflictivo.fechaEmision,
          tipoTramite: expedienteConflictivo.tipoTramite || 'OTROS'
        },
        conflictos: [
          `Expediente ${expedienteConflictivo.nroExpediente} ya existe`,
          `Empresa ID: ${expedienteConflictivo.empresaId || 'No especificada'}`,
          `Estado: ${expedienteConflictivo.estado || 'EN_TRAMITE'}`,
          `Tipo de Trámite: ${expedienteConflictivo.tipoTramite || 'OTROS'}`,
          `Fecha de emisión: ${expedienteConflictivo.fechaEmision.toLocaleDateString('es-ES')}`
        ]
      };
    }

    // Si se especifica empresaId, verificar que no haya conflictos específicos de empresa
    if (empresaId) {
      const conflictosEmpresa = this.validarConflictosEmpresa(expedientes, validacion);
      if (conflictosEmpresa.length > 0) {
        return {
          valido: false,
          mensaje: 'Existen conflictos con otros expedientes de la misma empresa',
          conflictos: conflictosEmpresa
        };
      }
    }

    return {
      valido: true,
      mensaje: `El número de expediente ${numero} está disponible para el año ${año}`
    };
  }

  /**
   * Valida el formato del número de expediente
   */
  private validarFormatoNumero(numero: string): boolean {
    const numeroInt = parseInt(numero);
    return !isNaN(numeroInt) && numeroInt > 0;
  }

  /**
   * Valida el año del expediente
   */
  private validarAño(año: number): boolean {
    const añoActual = new Date().getFullYear();
    return año >= 2000 && año <= añoActual + 1; // Permitir hasta el año siguiente
  }

  /**
   * Valida conflictos específicos de empresa
   */
  private validarConflictosEmpresa(expedientes: Expediente[], validacion: ValidacionExpediente): string[] {
    const { numero, año, empresaId, expedienteIdExcluir } = validacion;
    const conflictos: string[] = [];

    // Buscar expedientes de la misma empresa en el mismo año
    const expedientesEmpresa = expedientes.filter(expediente => {
      if (expedienteIdExcluir && expediente.id === expedienteIdExcluir) {
        return false;
      }
      return expediente.empresaId === empresaId;
    });

    // Verificar si hay expedientes del mismo tipo en el mismo año
    expedientesEmpresa.forEach(expediente => {
      const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
      if (match) {
        const añoExistente = parseInt(match[2]);
        if (añoExistente === año) {
          conflictos.push(`La empresa ya tiene un expediente en el año ${año}: ${expediente.nroExpediente}`);
        }
      }
    });

    return conflictos;
  }

  /**
   * Genera el número completo de expediente
   */
  generarNumeroExpediente(numero: string, año: number): string {
    const numeroFormateado = numero.padStart(4, '0');
    return `E-${numeroFormateado}-${año}`;
  }

  /**
   * Valida que el número de expediente no esté en uso por otra empresa
   */
  validarDisponibilidadGlobal(numero: string, año: number): Observable<boolean> {
    return this.expedienteService.getExpedientes().pipe(
      map(expedientes => {
        const numeroFormateado = numero.padStart(4, '0');
        const nroExpediente = `E-${numeroFormateado}-${año}`;
        
        return !expedientes.some(expediente => 
          expediente.nroExpediente === nroExpediente
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Obtiene sugerencias de números disponibles para un año específico
   */
  obtenerSugerenciasNumeros(año: number, cantidad: number = 5): Observable<string[]> {
    return this.expedienteService.getExpedientes().pipe(
      map(expedientes => {
        const numerosUsados = new Set<string>();
        
        // Extraer números usados en el año específico
        expedientes.forEach(expediente => {
          const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
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
   * Valida la secuencia de expedientes para una empresa
   */
  validarSecuenciaEmpresa(empresaId: string, año: number): Observable<ResultadoValidacionExpediente> {
    return this.expedienteService.getExpedientes().pipe(
      map(expedientes => {
        const expedientesEmpresa = expedientes.filter(expediente => 
          expediente.empresaId === empresaId
        );

        const expedientesAño = expedientesEmpresa.filter(expediente => {
          const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
          return match && parseInt(match[2]) === año;
        });

        if (expedientesAño.length === 0) {
          return {
            valido: true,
            mensaje: `No hay expedientes previos para la empresa en el año ${año}`
          };
        }

        // Verificar secuencia
        const numeros = expedientesAño.map(expediente => {
          const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        }).sort((a, b) => a - b);

        const siguienteNumero = numeros[numeros.length - 1] + 1;
        
        return {
          valido: true,
          mensaje: `Siguiente número sugerido: ${siguienteNumero}`,
          conflictos: [`Último expediente del año: E-${numeros[numeros.length - 1].toString().padStart(4, '0')}-${año}`]
        };
      }),
      catchError(() => of({
        valido: false,
        mensaje: 'Error al validar la secuencia de expedientes',
        conflictos: ['Error de conexión']
      }))
    );
  }

  /**
   * Valida que el número de expediente no esté en uso por otra empresa
   */
  validarDisponibilidadPorEmpresa(numero: string, año: number, empresaId: string): Observable<boolean> {
    return this.expedienteService.getExpedientes().pipe(
      map(expedientes => {
        const numeroFormateado = numero.padStart(4, '0');
        const nroExpediente = `E-${numeroFormateado}-${año}`;
        
        // Verificar que no exista un expediente con el mismo número en el mismo año
        const expedienteExistente = expedientes.find(expediente => 
          expediente.nroExpediente === nroExpediente
        );

        if (!expedienteExistente) {
          return true; // Número disponible
        }

        // Si existe, verificar que sea de la misma empresa
        return expedienteExistente.empresaId === empresaId;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Obtiene estadísticas de expedientes por año
   */
  obtenerEstadisticasPorAño(año: number): Observable<{
    total: number;
    porEmpresa: { [empresaId: string]: number };
    numerosUsados: string[];
  }> {
    return this.expedienteService.getExpedientes().pipe(
      map(expedientes => {
        const expedientesAño = expedientes.filter(expediente => {
          const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
          return match && parseInt(match[2]) === año;
        });

        const porEmpresa: { [empresaId: string]: number } = {};
        const numerosUsados: string[] = [];

        expedientesAño.forEach(expediente => {
          // Contar por empresa
          const empresaId = expediente.empresaId || 'SIN_EMPRESA';
          porEmpresa[empresaId] = (porEmpresa[empresaId] || 0) + 1;

          // Extraer número usado
          const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
          if (match) {
            numerosUsados.push(match[1]);
          }
        });

        return {
          total: expedientesAño.length,
          porEmpresa,
          numerosUsados: numerosUsados.sort((a, b) => parseInt(a) - parseInt(b))
        };
      }),
      catchError(() => of({
        total: 0,
        porEmpresa: {},
        numerosUsados: []
      }))
    );
  }
}
