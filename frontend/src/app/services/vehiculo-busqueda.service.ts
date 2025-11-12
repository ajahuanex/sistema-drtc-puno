import { Injectable, inject } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Vehiculo } from '../models/vehiculo.model';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { VehiculoService } from './vehiculo.service';
import { EmpresaService } from './empresa.service';
import { ResolucionService } from './resolucion.service';

/**
 * Interfaz para sugerencias de búsqueda
 */
export interface BusquedaSugerencia {
  tipo: 'vehiculo' | 'empresa' | 'resolucion';
  texto: string;
  valor: string;
  icono: string;
  relevancia: number;
  vehiculo?: Vehiculo;
  empresa?: Empresa;
  resolucion?: Resolucion;
}

/**
 * Interfaz para resultados de búsqueda global
 */
export interface ResultadoBusquedaGlobal {
  vehiculos: Vehiculo[];
  sugerencias: BusquedaSugerencia[];
  totalResultados: number;
  terminoBusqueda: string;
}

/**
 * Servicio para búsqueda global inteligente de vehículos
 * Implementa búsqueda en múltiples campos con ranking de relevancia
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoBusquedaService {
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  /**
   * Realiza una búsqueda global en todos los campos relevantes
   * @param termino Término de búsqueda
   * @param campos Campos específicos donde buscar (opcional)
   * @returns Observable con resultados de búsqueda
   */
  buscarGlobal(
    termino: string,
    campos?: ('placa' | 'marca' | 'modelo' | 'empresa' | 'resolucion')[]
  ): Observable<ResultadoBusquedaGlobal> {
    if (!termino || termino.trim().length === 0) {
      return of({
        vehiculos: [],
        sugerencias: [],
        totalResultados: 0,
        terminoBusqueda: ''
      });
    }

    const terminoNormalizado = this.normalizarTermino(termino);
    const camposBusqueda = campos || ['placa', 'marca', 'modelo', 'empresa', 'resolucion'];

    return combineLatest([
      this.vehiculoService.getVehiculos(),
      this.empresaService.getEmpresas(),
      this.resolucionService.getResoluciones()
    ]).pipe(
      map(([vehiculos, empresas, resoluciones]) => {
        // Buscar en vehículos con scoring de relevancia
        const resultadosConScore = vehiculos.map(vehiculo => ({
          vehiculo,
          score: this.calcularRelevancia(vehiculo, terminoNormalizado, camposBusqueda, empresas, resoluciones)
        }));

        // Filtrar solo resultados con score > 0 y ordenar por relevancia
        const vehiculosFiltrados = resultadosConScore
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(r => r.vehiculo);

        // Generar sugerencias
        const sugerencias = this.generarSugerencias(
          terminoNormalizado,
          vehiculosFiltrados,
          empresas,
          resoluciones
        );

        return {
          vehiculos: vehiculosFiltrados,
          sugerencias,
          totalResultados: vehiculosFiltrados.length,
          terminoBusqueda: termino
        };
      })
    );
  }

  /**
   * Calcula la relevancia de un vehículo respecto al término de búsqueda
   * @param vehiculo Vehículo a evaluar
   * @param termino Término de búsqueda normalizado
   * @param campos Campos donde buscar
   * @param empresas Lista de empresas para búsqueda
   * @param resoluciones Lista de resoluciones para búsqueda
   * @returns Score de relevancia (0 = no relevante, mayor = más relevante)
   */
  private calcularRelevancia(
    vehiculo: Vehiculo,
    termino: string,
    campos: string[],
    empresas: Empresa[],
    resoluciones: Resolucion[]
  ): number {
    let score = 0;

    // Búsqueda en placa (peso: 10 - más importante)
    if (campos.includes('placa')) {
      const placa = this.normalizarTermino(vehiculo.placa);
      if (placa === termino) {
        score += 100; // Coincidencia exacta
      } else if (placa.startsWith(termino)) {
        score += 50; // Comienza con el término
      } else if (placa.includes(termino)) {
        score += 25; // Contiene el término
      }
    }

    // Búsqueda en marca (peso: 7)
    if (campos.includes('marca')) {
      const marca = this.normalizarTermino(vehiculo.marca);
      if (marca === termino) {
        score += 70;
      } else if (marca.startsWith(termino)) {
        score += 35;
      } else if (marca.includes(termino)) {
        score += 17;
      }
    }

    // Búsqueda en modelo (peso: 5)
    if (campos.includes('modelo') && vehiculo.modelo) {
      const modelo = this.normalizarTermino(vehiculo.modelo);
      if (modelo === termino) {
        score += 50;
      } else if (modelo.startsWith(termino)) {
        score += 25;
      } else if (modelo.includes(termino)) {
        score += 12;
      }
    }

    // Búsqueda en empresa (peso: 8)
    if (campos.includes('empresa')) {
      const empresa = empresas.find(e => e.id === vehiculo.empresaActualId);
      if (empresa) {
        const razonSocial = this.normalizarTermino(empresa.razonSocial?.principal || '');
        const ruc = this.normalizarTermino(empresa.ruc || '');
        const codigoEmpresa = this.normalizarTermino(empresa.codigoEmpresa || '');

        if (razonSocial.includes(termino)) {
          score += 40;
        }
        if (ruc.includes(termino)) {
          score += 60; // RUC es más específico
        }
        if (codigoEmpresa.includes(termino)) {
          score += 80; // Código es muy específico
        }
      }
    }

    // Búsqueda en resolución (peso: 6)
    if (campos.includes('resolucion')) {
      const resolucion = resoluciones.find(r => r.id === vehiculo.resolucionId);
      if (resolucion) {
        const nroResolucion = this.normalizarTermino(resolucion.nroResolucion || '');
        const descripcion = this.normalizarTermino(resolucion.descripcion || '');

        if (nroResolucion.includes(termino)) {
          score += 60;
        }
        if (descripcion.includes(termino)) {
          score += 30;
        }
      }
    }

    return score;
  }

  /**
   * Genera sugerencias de búsqueda basadas en los resultados
   * @param termino Término de búsqueda
   * @param vehiculos Vehículos encontrados
   * @param empresas Lista de empresas
   * @param resoluciones Lista de resoluciones
   * @returns Array de sugerencias ordenadas por relevancia
   */
  private generarSugerencias(
    termino: string,
    vehiculos: Vehiculo[],
    empresas: Empresa[],
    resoluciones: Resolucion[]
  ): BusquedaSugerencia[] {
    const sugerencias: BusquedaSugerencia[] = [];

    // Sugerencias de vehículos (top 5)
    vehiculos.slice(0, 5).forEach((vehiculo, index) => {
      const empresa = empresas.find(e => e.id === vehiculo.empresaActualId);
      sugerencias.push({
        tipo: 'vehiculo',
        texto: `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo || ''}`,
        valor: vehiculo.id,
        icono: 'directions_car',
        relevancia: 100 - (index * 10),
        vehiculo
      });
    });

    // Sugerencias de empresas relacionadas
    const empresasRelacionadas = new Set(vehiculos.map(v => v.empresaActualId));
    Array.from(empresasRelacionadas).slice(0, 3).forEach((empresaId, index) => {
      const empresa = empresas.find(e => e.id === empresaId);
      if (empresa) {
        const cantidadVehiculos = vehiculos.filter(v => v.empresaActualId === empresaId).length;
        sugerencias.push({
          tipo: 'empresa',
          texto: `${empresa.razonSocial?.principal || 'Sin nombre'} (${cantidadVehiculos} vehículos)`,
          valor: empresa.id,
          icono: 'business',
          relevancia: 50 - (index * 5),
          empresa
        });
      }
    });

    // Sugerencias de resoluciones relacionadas
    const resolucionesRelacionadas = new Set(vehiculos.map(v => v.resolucionId));
    Array.from(resolucionesRelacionadas).slice(0, 3).forEach((resolucionId, index) => {
      const resolucion = resoluciones.find(r => r.id === resolucionId);
      if (resolucion) {
        const cantidadVehiculos = vehiculos.filter(v => v.resolucionId === resolucionId).length;
        sugerencias.push({
          tipo: 'resolucion',
          texto: `${resolucion.nroResolucion} (${cantidadVehiculos} vehículos)`,
          valor: resolucion.id,
          icono: 'description',
          relevancia: 40 - (index * 5),
          resolucion
        });
      }
    });

    // Ordenar por relevancia
    return sugerencias.sort((a, b) => b.relevancia - a.relevancia);
  }

  /**
   * Normaliza un término de búsqueda para comparación
   * @param termino Término a normalizar
   * @returns Término normalizado (minúsculas, sin acentos, sin espacios extra)
   */
  private normalizarTermino(termino: string): string {
    return termino
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .trim()
      .replace(/\s+/g, ' '); // Normalizar espacios
  }

  /**
   * Genera sugerencias alternativas cuando no hay resultados
   * @param termino Término de búsqueda original
   * @returns Array de sugerencias alternativas
   */
  generarSugerenciasAlternativas(termino: string): string[] {
    const sugerencias: string[] = [];

    // Sugerencia 1: Verificar ortografía
    sugerencias.push('Verifica la ortografía del término de búsqueda');

    // Sugerencia 2: Usar términos más generales
    if (termino.length > 5) {
      sugerencias.push('Intenta usar términos más cortos o generales');
    }

    // Sugerencia 3: Buscar por diferentes campos
    sugerencias.push('Prueba buscar por placa, marca, empresa o número de resolución');

    // Sugerencia 4: Limpiar filtros
    sugerencias.push('Limpia los filtros activos para ampliar la búsqueda');

    return sugerencias;
  }

  /**
   * Resalta el término de búsqueda en un texto
   * @param texto Texto donde resaltar
   * @param termino Término a resaltar
   * @returns Texto con marcas HTML para resaltado
   */
  resaltarTermino(texto: string, termino: string): string {
    if (!termino || !texto) {
      return texto;
    }

    const terminoNormalizado = this.normalizarTermino(termino);
    const regex = new RegExp(`(${terminoNormalizado})`, 'gi');
    
    return texto.replace(regex, '<mark>$1</mark>');
  }
}
