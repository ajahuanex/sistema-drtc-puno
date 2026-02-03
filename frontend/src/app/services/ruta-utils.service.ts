import { Injectable } from '@angular/core';
import { Ruta } from '../models/ruta.model';
import { Localidad } from '../models/localidad.model';

export interface RutaUnica {
  origen: string;
  destino: string;
  count: number;
  rutas: Ruta[];
  bidireccional: boolean; // true si existe tanto A->B como B->A
}

export interface FiltroRutaAvanzado {
  origen?: string;
  destino?: string;
  tipoRuta?: string;
  estado?: string;
  empresa?: string;
  soloUnicas?: boolean;
  soloBidireccionales?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RutaUtilsService {

  /**
   * Genera el nombre de la ruta como "ORIGEN - DESTINO"
   */
  getNombreRuta(ruta: Ruta): string {
    // Si tiene origen y destino definidos
    if (ruta.origen && ruta.destino) {
      const origen = typeof ruta.origen === 'string' ? ruta.origen : ruta.origen.nombre;
      const destino = typeof ruta.destino === 'string' ? ruta.destino : ruta.destino.nombre;
      return `${origen} - ${destino}`;
    }
    
    // Si no tiene origen/destino pero tiene itinerario como array
    if (ruta.itinerario && Array.isArray(ruta.itinerario) && ruta.itinerario.length > 0) {
      const localidades = ruta.itinerario.map(loc => loc.nombre);
      
      if (localidades.length >= 2) {
        return `${localidades[0]} - ${localidades[localidades.length - 1]}`;
      }
      
      // Si solo hay una localidad
      if (localidades.length === 1) {
        return localidades[0];
      }
    }
    
    // Si itinerario es string (compatibilidad con datos legacy)
    if (ruta.itinerario && typeof ruta.itinerario === 'string' && ruta.itinerario !== 'SIN ITINERARIO') {
      const itinerarioStr = ruta.itinerario as string;
      const itinerario = itinerarioStr.replace(/\s*-\s*/g, ' - ');
      const localidades = itinerario.split(' - ').map((loc: string) => loc.trim());
      
      if (localidades.length >= 2) {
        return `${localidades[0]} - ${localidades[localidades.length - 1]}`;
      }
      
      if (localidades.length === 1) {
        return localidades[0];
      }
    }
    
    // Fallback
    return ruta.nombre || 'SIN ITINERARIO';
  }

  /**
   * Obtiene el nombre de la empresa de una ruta
   */
  getEmpresaNombre(ruta: Ruta): string {
    if (!ruta.empresa) {
      return 'Sin empresa';
    }

    // Si tiene razón social estructurada
    if (ruta.empresa.razonSocial) {
      if (typeof ruta.empresa.razonSocial === 'object' && ruta.empresa.razonSocial.principal) {
        return ruta.empresa.razonSocial.principal;
      }
      if (typeof ruta.empresa.razonSocial === 'string') {
        return ruta.empresa.razonSocial;
      }
    }

    // Fallback al RUC si no hay razón social
    return ruta.empresa.ruc || 'Sin información';
  }

  /**
   * Normaliza el nombre de una localidad para comparaciones
   */
  private normalizarLocalidad(localidad: string): string {
    return localidad
      .toUpperCase()
      .trim()
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/Ñ/g, 'N');
  }

  /**
   * Obtiene el nombre normalizado del origen de una ruta
   */
  private getOrigenNormalizado(ruta: Ruta): string {
    if (typeof ruta.origen === 'string') {
      return this.normalizarLocalidad(ruta.origen);
    }
    return this.normalizarLocalidad(ruta.origen?.nombre || '');
  }

  /**
   * Obtiene el nombre normalizado del destino de una ruta
   */
  private getDestinoNormalizado(ruta: Ruta): string {
    if (typeof ruta.destino === 'string') {
      return this.normalizarLocalidad(ruta.destino);
    }
    return this.normalizarLocalidad(ruta.destino?.nombre || '');
  }

  /**
   * Analiza rutas únicas y bidireccionales
   */
  analizarRutasUnicas(rutas: Ruta[]): RutaUnica[] {
    const rutasMap = new Map<string, RutaUnica>();

    rutas.forEach(ruta => {
      const origen = this.getOrigenNormalizado(ruta);
      const destino = this.getDestinoNormalizado(ruta);
      
      if (!origen || !destino) return;

      // Crear clave ordenada alfabéticamente para detectar bidireccionales
      const claveOrdenada = [origen, destino].sort().join(' <-> ');
      const claveOriginal = `${origen} -> ${destino}`;

      if (!rutasMap.has(claveOrdenada)) {
        rutasMap.set(claveOrdenada, {
          origen: origen,
          destino: destino,
          count: 0,
          rutas: [],
          bidireccional: false
        });
      }

      const rutaUnica = rutasMap.get(claveOrdenada)!;
      rutaUnica.count++;
      rutaUnica.rutas.push(ruta);

      // Verificar si es bidireccional
      const tieneAB = rutaUnica.rutas.some(r => 
        this.getOrigenNormalizado(r) === origen && this.getDestinoNormalizado(r) === destino
      );
      const tieneBA = rutaUnica.rutas.some(r => 
        this.getOrigenNormalizado(r) === destino && this.getDestinoNormalizado(r) === origen
      );

      rutaUnica.bidireccional = tieneAB && tieneBA;
    });

    return Array.from(rutasMap.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Filtra rutas con criterios avanzados
   */
  filtrarRutasAvanzado(rutas: Ruta[], filtros: FiltroRutaAvanzado): Ruta[] {
    let rutasFiltradas = [...rutas];

    // Filtro por origen
    if (filtros.origen) {
      const origenNormalizado = this.normalizarLocalidad(filtros.origen);
      rutasFiltradas = rutasFiltradas.filter(ruta => 
        this.getOrigenNormalizado(ruta).includes(origenNormalizado)
      );
    }

    // Filtro por destino
    if (filtros.destino) {
      const destinoNormalizado = this.normalizarLocalidad(filtros.destino);
      rutasFiltradas = rutasFiltradas.filter(ruta => 
        this.getDestinoNormalizado(ruta).includes(destinoNormalizado)
      );
    }

    // Filtro por tipo de ruta
    if (filtros.tipoRuta) {
      rutasFiltradas = rutasFiltradas.filter(ruta => 
        ruta.tipoRuta === filtros.tipoRuta
      );
    }

    // Filtro por estado
    if (filtros.estado) {
      rutasFiltradas = rutasFiltradas.filter(ruta => 
        ruta.estado === filtros.estado
      );
    }

    // Filtro por empresa
    if (filtros.empresa) {
      const empresaNormalizada = this.normalizarLocalidad(filtros.empresa);
      rutasFiltradas = rutasFiltradas.filter(ruta => {
        const nombreEmpresa = this.getEmpresaNombre(ruta);
        const rucEmpresa = ruta.empresa?.ruc || '';
        return this.normalizarLocalidad(nombreEmpresa).includes(empresaNormalizada) ||
               rucEmpresa.includes(filtros.empresa!);
      });
    }

    // Filtro por rutas únicas
    if (filtros.soloUnicas) {
      const rutasUnicas = this.analizarRutasUnicas(rutasFiltradas);
      const idsRutasUnicas = new Set(
        rutasUnicas
          .filter(ru => ru.count === 1)
          .flatMap(ru => ru.rutas.map(r => r.id))
      );
      rutasFiltradas = rutasFiltradas.filter(ruta => idsRutasUnicas.has(ruta.id));
    }

    // Filtro por rutas bidireccionales
    if (filtros.soloBidireccionales) {
      const rutasUnicas = this.analizarRutasUnicas(rutasFiltradas);
      const idsRutasBidireccionales = new Set(
        rutasUnicas
          .filter(ru => ru.bidireccional)
          .flatMap(ru => ru.rutas.map(r => r.id))
      );
      rutasFiltradas = rutasFiltradas.filter(ruta => idsRutasBidireccionales.has(ruta.id));
    }

    return rutasFiltradas;
  }

  /**
   * Obtiene estadísticas de rutas
   */
  getEstadisticasRutas(rutas: Ruta[]) {
    const rutasUnicas = this.analizarRutasUnicas(rutas);
    
    return {
      total: rutas.length,
      activas: rutas.filter(r => r.estado === 'ACTIVA').length,
      inactivas: rutas.filter(r => r.estado === 'INACTIVA').length,
      suspendidas: rutas.filter(r => r.estado === 'SUSPENDIDA').length,
      rutasUnicas: rutasUnicas.length,
      rutasBidireccionales: rutasUnicas.filter(ru => ru.bidireccional).length,
      rutasConMasDeUnaEmpresa: rutasUnicas.filter(ru => {
        const empresas = new Set(ru.rutas.map(r => r.empresa?.ruc));
        return empresas.size > 1;
      }).length,
      tiposRuta: this.contarPorTipo(rutas, 'tipoRuta'),
      empresasConMasRutas: this.getEmpresasConMasRutas(rutas, 5)
    };
  }

  /**
   * Cuenta elementos por tipo
   */
  private contarPorTipo(rutas: Ruta[], campo: keyof Ruta): Record<string, number> {
    const conteo: Record<string, number> = {};
    rutas.forEach(ruta => {
      const valor = ruta[campo] as string || 'Sin definir';
      conteo[valor] = (conteo[valor] || 0) + 1;
    });
    return conteo;
  }

  /**
   * Obtiene las empresas con más rutas
   */
  private getEmpresasConMasRutas(rutas: Ruta[], limite: number = 5) {
    const empresasConteo: Record<string, { nombre: string; count: number; ruc: string }> = {};
    
    rutas.forEach(ruta => {
      const ruc = ruta.empresa?.ruc || 'Sin RUC';
      const nombre = this.getEmpresaNombre(ruta);
      
      if (!empresasConteo[ruc]) {
        empresasConteo[ruc] = { nombre, count: 0, ruc };
      }
      empresasConteo[ruc].count++;
    });

    return Object.values(empresasConteo)
      .sort((a, b) => b.count - a.count)
      .slice(0, limite);
  }

  /**
   * Busca rutas duplicadas (mismo origen-destino)
   */
  buscarRutasDuplicadas(rutas: Ruta[]): RutaUnica[] {
    return this.analizarRutasUnicas(rutas).filter(ru => ru.count > 1);
  }

  /**
   * Busca rutas huérfanas (sin empresa o resolución)
   */
  buscarRutasHuerfanas(rutas: Ruta[]): Ruta[] {
    return rutas.filter(ruta => 
      !ruta.empresa?.id || 
      !ruta.resolucion?.id ||
      !ruta.origen ||
      !ruta.destino
    );
  }

  /**
   * Valida la consistencia de una ruta
   */
  validarRuta(ruta: Ruta): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!ruta.codigoRuta) {
      errores.push('Falta código de ruta');
    }

    if (!ruta.origen) {
      errores.push('Falta origen');
    }

    if (!ruta.destino) {
      errores.push('Falta destino');
    }

    if (!ruta.empresa?.id) {
      errores.push('Falta empresa');
    }

    if (!ruta.resolucion?.id) {
      errores.push('Falta resolución');
    }

    if (!ruta.tipoRuta) {
      errores.push('Falta tipo de ruta');
    }

    // Validar que origen y destino no sean iguales
    if (ruta.origen && ruta.destino) {
      const origen = this.getOrigenNormalizado(ruta);
      const destino = this.getDestinoNormalizado(ruta);
      if (origen === destino) {
        errores.push('Origen y destino no pueden ser iguales');
      }
    }

    return {
      valida: errores.length === 0,
      errores
    };
  }
}