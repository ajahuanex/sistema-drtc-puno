import { Injectable } from '@angular/core';

/**
 * Servicio Helper para Vehículos
 * 
 * Proporciona métodos de utilidad para:
 * - Formatear información para mostrar en UI
 * - Obtener etiquetas y descripciones
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoHelperService {

  /**
   * Obtener descripción de categoría
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
   */
  calcularEdad(anioFabricacion: number): number {
    const anioActual = new Date().getFullYear();
    return anioActual - anioFabricacion;
  }

  /**
   * Obtener descripción de edad
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
