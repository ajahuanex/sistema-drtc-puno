// ========================================
// UTILIDADES PARA VALIDACIÓN BINARIA
// ========================================
// Formato: 3 bits (XXX)
// Bit 0 (001): RUC validado
// Bit 1 (010): Resolución validada
// Bit 2 (100): Localidades validadas
//
// Ejemplos:
// "000" = ninguna validación
// "001" = solo RUC validado
// "010" = solo Resolución validado
// "100" = solo Localidades validadas
// "011" = RUC + Resolución validados
// "101" = RUC + Localidades validados
// "110" = Resolución + Localidades validados
// "111" = todas validadas
// ========================================

export class ValidacionBinaria {
  // Constantes de bits
  static readonly BIT_RUC = 0;           // Bit 0 (001)
  static readonly BIT_RESOLUCION = 1;    // Bit 1 (010)
  static readonly BIT_LOCALIDADES = 2;   // Bit 2 (100)
  
  // Valores de bits
  static readonly VALOR_RUC = 1;          // 001
  static readonly VALOR_RESOLUCION = 2;   // 010
  static readonly VALOR_LOCALIDADES = 4;  // 100

  /**
   * Crear una cadena binaria a partir de los estados individuales
   */
  static crearBinaria(
    rucValidado: boolean = false,
    resolucionValidada: boolean = false,
    localidadesValidadas: boolean = false
  ): string {
    let valor = 0;

    if (rucValidado) {
      valor |= this.VALOR_RUC;
    }

    if (resolucionValidada) {
      valor |= this.VALOR_RESOLUCION;
    }

    if (localidadesValidadas) {
      valor |= this.VALOR_LOCALIDADES;
    }

    return valor.toString(2).padStart(3, '0'); // Formato de 3 bits con ceros a la izquierda
  }

  /**
   * Verificar si RUC está validado
   */
  static validarRuc(validacionBinaria: string): boolean {
    try {
      const valor = parseInt(validacionBinaria, 2);
      return !!(valor & this.VALOR_RUC);
    } catch {
      return false;
    }
  }

  /**
   * Verificar si Resolución está validada
   */
  static validarResolucion(validacionBinaria: string): boolean {
    try {
      const valor = parseInt(validacionBinaria, 2);
      return !!(valor & this.VALOR_RESOLUCION);
    } catch {
      return false;
    }
  }

  /**
   * Verificar si Localidades están validadas
   */
  static validarLocalidades(validacionBinaria: string): boolean {
    try {
      const valor = parseInt(validacionBinaria, 2);
      return !!(valor & this.VALOR_LOCALIDADES);
    } catch {
      return false;
    }
  }

  /**
   * Verificar si todas las validaciones están completas (111)
   */
  static todasValidadas(validacionBinaria: string): boolean {
    return validacionBinaria === '111';
  }

  /**
   * Establecer el estado del RUC en la validación binaria
   */
  static establecerRuc(validacionBinaria: string, validado: boolean = true): string {
    let valor = validacionBinaria ? parseInt(validacionBinaria, 2) : 0;

    if (validado) {
      valor |= this.VALOR_RUC;
    } else {
      valor &= ~this.VALOR_RUC;
    }

    return valor.toString(2).padStart(3, '0');
  }

  /**
   * Establecer el estado de la Resolución en la validación binaria
   */
  static establecerResolucion(validacionBinaria: string, validado: boolean = true): string {
    let valor = validacionBinaria ? parseInt(validacionBinaria, 2) : 0;

    if (validado) {
      valor |= this.VALOR_RESOLUCION;
    } else {
      valor &= ~this.VALOR_RESOLUCION;
    }

    return valor.toString(2).padStart(3, '0');
  }

  /**
   * Establecer el estado de Localidades en la validación binaria
   */
  static establecerLocalidades(validacionBinaria: string, validado: boolean = true): string {
    let valor = validacionBinaria ? parseInt(validacionBinaria, 2) : 0;

    if (validado) {
      valor |= this.VALOR_LOCALIDADES;
    } else {
      valor &= ~this.VALOR_LOCALIDADES;
    }

    return valor.toString(2).padStart(3, '0');
  }

  /**
   * Obtener descripción legible del estado de validación
   */
  static obtenerDescripcion(validacionBinaria: string): {
    binario: string;
    decimal: number;
    rucValidado: boolean;
    resolucionValidada: boolean;
    localidadesValidadas: boolean;
    todasValidadas: boolean;
    descripcion: string;
  } {
    return {
      binario: validacionBinaria,
      decimal: validacionBinaria ? parseInt(validacionBinaria, 2) : 0,
      rucValidado: this.validarRuc(validacionBinaria),
      resolucionValidada: this.validarResolucion(validacionBinaria),
      localidadesValidadas: this.validarLocalidades(validacionBinaria),
      todasValidadas: this.todasValidadas(validacionBinaria),
      descripcion: this._generarDescripcionTexto(validacionBinaria)
    };
  }

  /**
   * Generar descripción en texto del estado de validación
   */
  private static _generarDescripcionTexto(validacionBinaria: string): string {
    const validaciones: string[] = [];

    if (this.validarRuc(validacionBinaria)) {
      validaciones.push('RUC');
    }

    if (this.validarResolucion(validacionBinaria)) {
      validaciones.push('Resolución');
    }

    if (this.validarLocalidades(validacionBinaria)) {
      validaciones.push('Localidades');
    }

    if (validaciones.length === 0) {
      return 'Pendiente de validar';
    } else if (validaciones.length === 3) {
      return 'Todas validadas';
    } else {
      return `Validadas: ${validaciones.join(', ')}`;
    }
  }

  /**
   * Obtener un badge/color basado en el estado de validación
   */
  static obtenerEstilo(validacionBinaria: string): {
    clase: string;
    color: string;
    icono: string;
    texto: string;
  } {
    const estado = this.obtenerDescripcion(validacionBinaria);

    if (estado.todasValidadas) {
      return {
        clase: 'validacion-completa',
        color: 'success',
        icono: 'check_circle',
        texto: 'Validada'
      };
    } else if (estado.rucValidado || estado.resolucionValidada || estado.localidadesValidadas) {
      return {
        clase: 'validacion-parcial',
        color: 'warning',
        icono: 'info',
        texto: 'Validación parcial'
      };
    } else {
      return {
        clase: 'validacion-pendiente',
        color: 'warn',
        icono: 'pending',
        texto: 'Pendiente'
      };
    }
  }
}

// Ejemplos de uso:
// ValidacionBinaria.crearBinaria(true, true, false) -> "011"
// ValidacionBinaria.validarRuc("011") -> true
// ValidacionBinaria.validarLocalidades("011") -> false
// ValidacionBinaria.todasValidadas("111") -> true
// ValidacionBinaria.establecerLocalidades("011", true) -> "111"
// ValidacionBinaria.obtenerDescripcion("011") -> {...}
