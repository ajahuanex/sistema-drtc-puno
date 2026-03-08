import { Injectable } from '@angular/core';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number; // milisegundos
}

@Injectable({
  providedIn: 'root'
})
export class GeojsonCacheService {
  private cache = new Map<string, CacheEntry>();
  
  // Tiempos de expiración por tipo de dato
  private readonly CACHE_TIMES = {
    provincias: 24 * 60 * 60 * 1000,      // 24 horas (datos estáticos)
    distritos: 24 * 60 * 60 * 1000,       // 24 horas (datos estáticos)
    centrosPoblados: 5 * 60 * 1000,       // 5 minutos (datos dinámicos)
    localidades: 5 * 60 * 1000            // 5 minutos (datos dinámicos)
  };

  constructor() {
    // Limpiar caché expirado cada 10 minutos
    setInterval(() => this.cleanExpiredCache(), 10 * 60 * 1000);
  }

  /**
   * Obtener datos del caché
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si expiró
    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    console.log(`📦 Cache HIT: ${key}`);
    return entry.data;
  }

  /**
   * Guardar datos en el caché
   */
  set(key: string, data: any, type: keyof typeof this.CACHE_TIMES = 'localidades'): void {
    const expiresIn = this.CACHE_TIMES[type];
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });

    console.log(`💾 Cache SET: ${key} (expira en ${expiresIn / 1000}s)`);
  }

  /**
   * Invalidar una entrada específica del caché
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache INVALIDATED: ${key}`);
  }

  /**
   * Invalidar todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.cache.delete(key);
    });

    console.log(`🗑️ Cache INVALIDATED (pattern): ${pattern} (${matchingKeys.length} entries)`);
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache CLEARED: ${size} entries removed`);
  }

  /**
   * Limpiar entradas expiradas
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cache CLEANED: ${cleaned} expired entries removed`);
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    entries: Array<{ key: string; age: number; expiresIn: number }>;
  } {
    const now = Date.now();
    const entries: Array<{ key: string; age: number; expiresIn: number }> = [];
    let totalSize = 0;

    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp;
      entries.push({
        key,
        age,
        expiresIn: entry.expiresIn - age
      });
      
      // Estimar tamaño (aproximado)
      totalSize += JSON.stringify(entry.data).length;
    });

    return {
      totalEntries: this.cache.size,
      totalSize,
      entries
    };
  }

  /**
   * Generar clave de caché para GeoJSON
   */
  static generateKey(type: string, filters: Record<string, any> = {}): string {
    const filterStr = Object.entries(filters)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return filterStr ? `${type}|${filterStr}` : type;
  }
}
