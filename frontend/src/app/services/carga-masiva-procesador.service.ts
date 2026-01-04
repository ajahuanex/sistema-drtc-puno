import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { VehiculoService } from './vehiculo.service';
import { EmpresaService } from './empresa.service';
import { ResolucionService } from './resolucion.service';
import { VehiculoCreate, DatosTecnicos, Tuc } from '../models/vehiculo.model';

export interface FilaCargaMasiva {
  // Campos de empresa
  rucEmpresa: string;
  dni: string;
  
  // Campos de resolución
  resolucionPrimigenia: string;
  resolucionHija: string;
  fechaResolucion: string;
  tipoResolucion: string;
  
  // Campos de vehículo
  placaBaja: string;
  placa: string;
  marca: string;
  modelo: string;
  anioFabricacion: string;
  color: string;
  categoria: string;
  carroceria: string;
  tipoCombustible: string;
  motor: string;
  numeroSerieVIN: string;
  numeroPasajeros: string;
  asientos: string;
  cilindros: string;
  ejes: string;
  ruedas: string;
  pesoBruto: string;
  pesoNeto: string;
  cargaUtil: string;
  largo: string;
  ancho: string;
  alto: string;
  cilindrada: string;
  potencia: string;
  estado: string;
  observaciones: string;
  sedeRegistro: string;
  expediente: string;
  tuc: string;
  rutasAsignadas: string;
}

export interface ResultadoProcesamiento {
  exito: boolean;
  vehiculoId?: string;
  placa: string;
  errores: string[];
  advertencias: string[];
  entidadesValidadas: {
    empresa?: boolean;
    resolucion?: boolean;
    vehiculo?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CargaMasivaProcesadorService {
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  /**
   * Procesar una fila de la carga masiva (solo validación)
   */
  procesarFila(fila: FilaCargaMasiva): Observable<ResultadoProcesamiento> {
    console.log('[PROCESADOR] 🚀 Validando fila:', fila.placa);
    
    const resultado: ResultadoProcesamiento = {
      exito: false,
      placa: fila.placa,
      errores: [],
      advertencias: [],
      entidadesValidadas: {}
    };

    // Validar campos obligatorios
    if (!fila.placa) {
      resultado.errores.push('Placa es obligatoria');
      return of(resultado);
    }

    // Validar formato de placa
    if (!this.validarFormatoPlaca(fila.placa)) {
      resultado.errores.push('Formato de placa inválido');
    }

    // Validar RUC de empresa
    if (fila.rucEmpresa) {
      if (!this.validarFormatoRUC(fila.rucEmpresa)) {
        resultado.errores.push('Formato de RUC inválido');
      } else {
        resultado.entidadesValidadas.empresa = true;
      }
    }

    // Validar DNI
    if (fila.dni) {
      const dniCompleto = this.completarDNI(fila.dni);
      if (dniCompleto.length !== 8) {
        resultado.errores.push('DNI debe tener 8 dígitos');
      } else {
        resultado.advertencias.push(`DNI completado: ${fila.dni} → ${dniCompleto}`);
      }
    }

    // Validar resolución
    if (fila.resolucionPrimigenia || fila.resolucionHija) {
      resultado.entidadesValidadas.resolucion = true;
    }

    // Validar TUC
    if (fila.tuc) {
      const tucCompleto = this.completarTUC(fila.tuc);
      if (tucCompleto.length !== 6) {
        resultado.errores.push('TUC debe tener 6 dígitos');
      } else {
        resultado.advertencias.push(`TUC completado: ${fila.tuc} → ${tucCompleto}`);
      }
    }

    // Validar datos técnicos
    this.validarDatosTecnicos(fila, resultado);

    // Construir datos del vehículo para validación
    const vehiculoData = this.construirDatosVehiculo(fila, resultado);
    if (vehiculoData) {
      resultado.entidadesValidadas.vehiculo = true;
    }

    resultado.exito = resultado.errores.length === 0;
    return of(resultado);
  }

  /**
   * Validar formato de placa
   */
  private validarFormatoPlaca(placa: string): boolean {
    if (!placa) return false;
    // Formato: ABC-123 o ABC123
    const regex = /^[A-Z]{3}-?\d{3}$/;
    return regex.test(placa.toUpperCase());
  }

  /**
   * Validar formato de RUC
   */
  private validarFormatoRUC(ruc: string): boolean {
    if (!ruc) return false;
    // RUC debe tener 11 dígitos
    const rucLimpio = ruc.replace(/\D/g, '');
    return rucLimpio.length === 11;
  }

  /**
   * Validar datos técnicos del vehículo
   */
  private validarDatosTecnicos(fila: FilaCargaMasiva, resultado: ResultadoProcesamiento): void {
    // Validar año de fabricación
    if (fila.anioFabricacion) {
      const anio = this.parseNumber(fila.anioFabricacion);
      const anioActual = new Date().getFullYear();
      if (!anio || anio < 1900 || anio > anioActual + 1) {
        resultado.errores.push(`Año de fabricación inválido: ${fila.anioFabricacion}`);
      }
    }

    // Validar número de pasajeros
    if (fila.numeroPasajeros) {
      const pasajeros = this.parseNumber(fila.numeroPasajeros);
      if (!pasajeros || pasajeros < 1 || pasajeros > 100) {
        resultado.errores.push(`Número de pasajeros inválido: ${fila.numeroPasajeros}`);
      }
    }

    // Validar asientos
    if (fila.asientos) {
      const asientos = this.parseNumber(fila.asientos);
      if (!asientos || asientos < 1 || asientos > 100) {
        resultado.errores.push(`Número de asientos inválido: ${fila.asientos}`);
      }
    }

    // Validar pesos
    if (fila.pesoBruto && fila.pesoNeto) {
      const pesoBruto = this.parseDecimal(fila.pesoBruto);
      const pesoNeto = this.parseDecimal(fila.pesoNeto);
      if (pesoBruto && pesoNeto && pesoBruto < pesoNeto) {
        resultado.errores.push('Peso bruto no puede ser menor que peso neto');
      }
    }
  }

  /**
   * Construir datos del vehículo desde la fila
   */
  private construirDatosVehiculo(fila: FilaCargaMasiva, resultado: ResultadoProcesamiento): Partial<VehiculoCreate> | null {
    try {
      // Construir datos técnicos
      const datosTecnicos: Partial<DatosTecnicos> = {
        motor: fila.motor || '',
        chasis: '', // No está en la plantilla, usar valor por defecto
        tipoCombustible: fila.tipoCombustible || 'GASOLINA',
        ejes: this.parseNumber(fila.ejes) || 2,
        asientos: this.parseNumber(fila.asientos) || 1,
        numeroPasajeros: this.parseNumber(fila.numeroPasajeros), // NUEVO CAMPO
        pesoNeto: this.parseDecimal(fila.pesoNeto) || 0,
        pesoBruto: this.parseDecimal(fila.pesoBruto) || 0,
        medidas: {
          largo: this.parseDecimal(fila.largo) || 0,
          ancho: this.parseDecimal(fila.ancho) || 0,
          alto: this.parseDecimal(fila.alto) || 0
        }
      };

      // Campos opcionales de datos técnicos
      if (fila.cilindros) datosTecnicos.cilindros = this.parseNumber(fila.cilindros);
      if (fila.ruedas) datosTecnicos.ruedas = this.parseNumber(fila.ruedas);
      if (fila.cargaUtil) datosTecnicos.cargaUtil = this.parseDecimal(fila.cargaUtil);
      if (fila.cilindrada) datosTecnicos.cilindrada = this.parseNumber(fila.cilindrada);
      if (fila.potencia) datosTecnicos.potencia = this.parseNumber(fila.potencia);

      // Construir TUC si se proporciona
      let tuc: Tuc | undefined;
      if (fila.tuc) {
        const tucCompleto = this.completarTUC(fila.tuc);
        tuc = {
          nroTuc: tucCompleto,
          fechaEmision: new Date().toISOString()
        };
      }

      // Procesar rutas asignadas
      let rutasAsignadasIds: string[] = [];
      if (fila.rutasAsignadas) {
        rutasAsignadasIds = this.procesarRutasAsignadas(fila.rutasAsignadas);
      }

      const vehiculoData: Partial<VehiculoCreate> = {
        placa: fila.placa,
        placaBaja: fila.placaBaja || undefined, // NUEVO CAMPO
        sedeRegistro: fila.sedeRegistro || undefined,
        marca: fila.marca || '',
        modelo: fila.modelo || '',
        anioFabricacion: this.parseNumber(fila.anioFabricacion) || new Date().getFullYear(),
        categoria: fila.categoria || 'M1',
        carroceria: fila.carroceria || undefined,
        color: fila.color || undefined,
        numeroSerie: fila.numeroSerieVIN || undefined,
        observaciones: fila.observaciones || undefined,
        datosTecnicos: datosTecnicos as DatosTecnicos,
        tuc: tuc,
        rutasAsignadasIds: rutasAsignadasIds
      };

      return vehiculoData;

    } catch (error) {
      console.error('[PROCESADOR] ❌ Error construyendo datos del vehículo:', error);
      resultado.errores.push(`Error en datos del vehículo: ${error}`);
      return null;
    }
  }

  /**
   * Completar DNI a 8 dígitos
   */
  private completarDNI(dni: string): string {
    if (!dni) return '';
    const dniLimpio = dni.replace(/\D/g, ''); // Solo dígitos
    return dniLimpio.padStart(8, '0');
  }

  /**
   * Completar TUC a 6 dígitos (sin prefijos)
   */
  private completarTUC(tuc: string): string {
    if (!tuc) return '';
    
    // Remover prefijo T- si existe
    let tucLimpio = tuc.replace(/^T-/, '');
    
    // Extraer solo los números (primeros 6 dígitos)
    const numeros = tucLimpio.replace(/\D/g, '').substring(0, 6);
    
    return numeros.padStart(6, '0');
  }

  /**
   * Procesar rutas asignadas (formato: "01,02,03" o "1,2,3")
   */
  private procesarRutasAsignadas(rutasStr: string): string[] {
    if (!rutasStr) return [];
    
    return rutasStr.split(',')
      .map(ruta => ruta.trim())
      .filter(ruta => ruta.length > 0)
      .map(ruta => ruta.padStart(2, '0')); // Normalizar a 2 dígitos
  }

  /**
   * Parsear número entero
   */
  private parseNumber(value: string): number | undefined {
    if (!value) return undefined;
    const num = parseInt(value.toString().trim());
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parsear número decimal
   */
  private parseDecimal(value: string): number | undefined {
    if (!value) return undefined;
    const num = parseFloat(value.toString().trim());
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parsear fecha en formato DD/MM/AAAA
   */
  private parsearFecha(fechaStr: string): Date | null {
    if (!fechaStr) return null;
    
    const partes = fechaStr.split('/');
    if (partes.length !== 3) return null;
    
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1; // Los meses en JS van de 0-11
    const anio = parseInt(partes[2]);
    
    const fecha = new Date(anio, mes, dia);
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  /**
   * Procesar múltiples filas (solo validación)
   */
  procesarLote(filas: FilaCargaMasiva[]): Observable<ResultadoProcesamiento[]> {
    console.log('[PROCESADOR] 📦 Validando lote de', filas.length, 'filas');
    
    const resultados = filas.map(fila => {
      const resultado = this.procesarFila(fila);
      return resultado;
    });
    
    return of(resultados.map(obs => {
      let resultado: ResultadoProcesamiento;
      obs.subscribe(res => resultado = res);
      return resultado!;
    })).pipe(
      map(resultados => {
        const exitosos = resultados.filter(r => r.exito).length;
        const errores = resultados.filter(r => !r.exito).length;
        
        console.log('[PROCESADOR] ✅ Validación completada:', exitosos, 'válidos,', errores, 'con errores');
        
        return resultados;
      })
    );
  }
}