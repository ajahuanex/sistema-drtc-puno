import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, of } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculoSolo } from '../models/vehiculo-solo.model';
import { VehiculoIntegrationService } from './vehiculo-integration.service';

/**
 * Servicio Helper para Vehículos
 * 
 * Proporciona métodos de utilidad para:
 * - Obtener datos técnicos de un vehículo
 * - Formatear información para mostrar en UI
 * - Validar datos
 * - Obtener etiquetas y descripciones
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoHelperService {
  private integrationService = inject(VehiculoIntegrationService);

  /**
   * Obtener marca de un vehículo
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con marca
   */
  obtenerMarca(vehiculo: Vehiculo): Observable<string> {
    if (!vehiculo.vehiculoDataId) {
      return of('N/A');
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => vehiculoConDatos.datosTecnicos?.marca || 'N/A'),
      switchMap(marca => of(marca))
    );
  }

  /**
   * Obtener modelo de un vehículo
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con modelo
   */
  obtenerModelo(vehiculo: Vehiculo): Observable<string> {
    if (!vehiculo.vehiculoDataId) {
      return of('N/A');
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => vehiculoConDatos.datosTecnicos?.modelo || 'N/A'),
      switchMap(modelo => of(modelo))
    );
  }

  /**
   * Obtener marca y modelo formateados
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con "MARCA MODELO"
   */
  obtenerMarcaModelo(vehiculo: Vehiculo): Observable<string> {
    if (!vehiculo.vehiculoDataId) {
      return of('N/A');
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => {
        const marca = vehiculoConDatos.datosTecnicos?.marca || '';
        const modelo = vehiculoConDatos.datosTecnicos?.modelo || '';
        return `${marca} ${modelo}`.trim() || 'N/A';
      })
    );
  }

  /**
   * Obtener categoría de un vehículo
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con categoría
   */
  obtenerCategoria(vehiculo: Vehiculo): Observable<string> {
    if (!vehiculo.vehiculoDataId) {
      return of('N/A');
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => vehiculoConDatos.datosTecnicos?.categoria || 'N/A'),
      switchMap(categoria => of(categoria))
    );
  }

  /**
   * Obtener año de fabricación
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con año
   */
  obtenerAnio(vehiculo: Vehiculo): Observable<number | string> {
    if (!vehiculo.vehiculoDataId) {
      return of('N/A');
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => vehiculoConDatos.datosTecnicos?.anioFabricacion || 'N/A'),
      switchMap(anio => of(anio))
    );
  }

  /**
   * Obtener color
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con color
   */
  obtenerColor(vehiculo: Vehiculo): Observable<string> {
    if (!vehiculo.vehiculoDataId) {
      return of('N/A');
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => vehiculoConDatos.datosTecnicos?.color || 'N/A'),
      switchMap(color => of(color))
    );
  }

  /**
   * Obtener número de serie
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con número de serie
   */
  obtenerNumeroSerie(vehiculo: Vehiculo): Observable<string> {
    if (!vehiculo.vehiculoDataId) {
      return of('N/A');
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => vehiculoConDatos.datosTecnicos?.numeroSerie || 'N/A'),
      switchMap(numeroSerie => of(numeroSerie))
    );
  }

  /**
   * Obtener todos los datos técnicos
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con datos técnicos completos
   */
  obtenerDatosTecnicos(vehiculo: Vehiculo): Observable<VehiculoSolo | null> {
    if (!vehiculo.vehiculoDataId) {
      return of(null);
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => vehiculoConDatos.datosTecnicos || null)
    );
  }

  /**
   * Obtener información formateada para mostrar en tabla
   * 
   * @param vehiculo - Vehículo
   * @returns Observable con objeto con información formateada
   */
  obtenerInfoFormateada(vehiculo: Vehiculo): Observable<VehiculoInfoFormateada> {
    if (!vehiculo.vehiculoDataId) {
      return of({
        marca: 'N/A',
        modelo: 'N/A',
        marcaModelo: 'N/A',
        categoria: 'N/A',
        anio: 'N/A',
        color: 'N/A',
        numeroSerie: 'N/A'
      });
    }

    return this.integrationService.obtenerVehiculoCompleto(vehiculo.id).pipe(
      map(vehiculoConDatos => {
        const datos = vehiculoConDatos.datosTecnicos;
        return {
          marca: datos?.marca || 'N/A',
          modelo: datos?.modelo || 'N/A',
          marcaModelo: `${datos?.marca || ''} ${datos?.modelo || ''}`.trim() || 'N/A',
          categoria: datos?.categoria || 'N/A',
          anio: datos?.anioFabricacion || 'N/A',
          color: datos?.color || 'N/A',
          numeroSerie: datos?.numeroSerie || 'N/A'
        };
      })
    );
  }

  /**
   * Validar que un vehículo tiene datos técnicos
   * 
   * @param vehiculo - Vehículo
   * @returns true si tiene datos técnicos
   */
  tieneDatosTecnicos(vehiculo: Vehiculo): boolean {
    return !!vehiculo.vehiculoDataId;
  }

  /**
   * Obtener descripción de categoría
   * 
   * @param categoria - Código de categoría
   * @returns Descripción legible
   */
  getDescripcionCategoria(categoria: string): string {
    const descripciones: Record<string, string> = {
      'M1': 'Pasajeros hasta 8 asientos',
      'M2': 'Pasajeros más de 8 asientos, peso ≤ 5 ton',
      'M3': 'Pasajeros más de 8 asientos, peso > 5 ton',
      'N1': 'Carga peso ≤ 3.5 ton',
      'N2': 'Carga 3.5 ton < peso ≤ 12 ton',
      'N3': 'Carga peso > 12 ton',
      'L': 'Motocicletas y similares',
      'O': 'Remolques y semirremolques'
    };

    return descripciones[categoria] || categoria;
  }

  /**
   * Obtener descripción de carrocería
   * 
   * @param carroceria - Tipo de carrocería
   * @returns Descripción legible
   */
  getDescripcionCarroceria(carroceria: string): string {
    const descripciones: Record<string, string> = {
      'SEDAN': 'Sedán',
      'HATCHBACK': 'Hatchback',
      'STATION_WAGON': 'Station Wagon',
      'SUV': 'SUV',
      'PICK_UP': 'Pick Up',
      'VAN': 'Van',
      'MINIVAN': 'Minivan',
      'MINIBUS': 'Minibús',
      'BUS': 'Autobús',
      'CAMION': 'Camión',
      'CAMIONETA': 'Camioneta',
      'PANEL': 'Panel',
      'FURGON': 'Furgón',
      'REMOLQUE': 'Remolque',
      'SEMIRREMOLQUE': 'Semirremolque',
      'MOTOCICLETA': 'Motocicleta',
      'MOTOTAXI': 'Mototaxi',
      'OTRO': 'Otro'
    };

    return descripciones[carroceria] || carroceria;
  }

  /**
   * Obtener descripción de combustible
   * 
   * @param combustible - Tipo de combustible
   * @returns Descripción legible
   */
  getDescripcionCombustible(combustible: string): string {
    const descripciones: Record<string, string> = {
      'GASOLINA': 'Gasolina',
      'DIESEL': 'Diésel',
      'GLP': 'GLP (Gas Licuado de Petróleo)',
      'GNV': 'GNV (Gas Natural Vehicular)',
      'ELECTRICO': 'Eléctrico',
      'HIBRIDO': 'Híbrido',
      'HIBRIDO_ENCHUFABLE': 'Híbrido Enchufable',
      'HIDROGENO': 'Hidrógeno',
      'OTRO': 'Otro'
    };

    return descripciones[combustible] || combustible;
  }

  /**
   * Obtener descripción de estado físico
   * 
   * @param estado - Estado físico
   * @returns Descripción legible
   */
  getDescripcionEstadoFisico(estado: string): string {
    const descripciones: Record<string, string> = {
      'NUEVO': 'Nuevo',
      'EXCELENTE': 'Excelente',
      'BUENO': 'Bueno',
      'REGULAR': 'Regular',
      'MALO': 'Malo',
      'CHATARRA': 'Chatarra',
      'DESCONOCIDO': 'Desconocido'
    };

    return descripciones[estado] || estado;
  }

  /**
   * Calcular edad del vehículo
   * 
   * @param anioFabricacion - Año de fabricación
   * @returns Edad en años
   */
  calcularEdad(anioFabricacion: number): number {
    const anioActual = new Date().getFullYear();
    return anioActual - anioFabricacion;
  }

  /**
   * Obtener descripción de edad
   * 
   * @param anioFabricacion - Año de fabricación
   * @returns Descripción de edad
   */
  getDescripcionEdad(anioFabricacion: number): string {
    const edad = this.calcularEdad(anioFabricacion);

    if (edad < 1) return 'Nuevo';
    if (edad < 3) return 'Reciente';
    if (edad < 5) return 'Moderno';
    if (edad < 10) return 'Usado';
    if (edad < 15) return 'Antiguo';
    return 'Muy antiguo';
  }
}

/**
 * Interfaz para información formateada de vehículo
 */
export interface VehiculoInfoFormateada {
  marca: string;
  modelo: string;
  marcaModelo: string;
  categoria: string;
  anio: string | number;
  color: string;
  numeroSerie: string;
}
