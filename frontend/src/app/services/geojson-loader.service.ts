import { Injectable } from '@angular/core';
import { GeojsonCacheService } from './geojson-cache.service';

@Injectable({
  providedIn: 'root'
})
export class GeojsonLoaderService {
  private readonly API_BASE = '/api/v1/localidades';

  constructor(private cacheService: GeojsonCacheService) {}

  /**
   * Cargar provincias (desde archivo estático con caché)
   */
  async loadProvincias(): Promise<any> {
    const cacheKey = 'geojson:provincias';
    
    // Intentar obtener del caché
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Cargar desde archivo
    const response = await fetch('assets/geojson/puno-provincias.geojson');
    const data = await response.json();
    
    // Guardar en caché (24 horas)
    this.cacheService.set(cacheKey, data, 'provincias');
    
    return data;
  }

  /**
   * Cargar distritos (desde archivo estático con caché)
   */
  async loadDistritos(): Promise<any> {
    const cacheKey = 'geojson:distritos';
    
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch('assets/geojson/puno-distritos.geojson');
    const data = await response.json();
    
    this.cacheService.set(cacheKey, data, 'distritos');
    
    return data;
  }

  /**
   * Cargar centros poblados (desde API con caché)
   */
  async loadCentrosPoblados(filters: {
    provincia?: string;
    distrito?: string;
    activosSolo?: boolean;
  } = {}): Promise<any> {
    const cacheKey = GeojsonCacheService.generateKey('centros-poblados', filters);
    
    // Intentar obtener del caché
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Construir URL con filtros
    const params = new URLSearchParams();
    if (filters.provincia) params.append('provincia', filters.provincia);
    if (filters.distrito) params.append('distrito', filters.distrito);
    if (filters.activosSolo !== undefined) params.append('activos_solo', String(filters.activosSolo));

    const url = `${this.API_BASE}/centros-poblados/geojson?${params.toString()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Guardar en caché (5 minutos)
      this.cacheService.set(cacheKey, data, 'centrosPoblados');
      
      return data;
    } catch (error) {
      console.error('Error cargando centros poblados desde API:', error);
      
      // Fallback: intentar cargar desde archivo estático
      return this.loadCentrosPobladosFromFile(filters);
    }
  }

  /**
   * Cargar centros poblados desde archivo (fallback)
   * DESHABILITADO: Archivo muy grande (10MB, 9372 features)
   */
  private async loadCentrosPobladosFromFile(filters: {
    provincia?: string;
    distrito?: string;
  } = {}): Promise<any> {
    console.error('❌ Fallback deshabilitado: archivo puno-centrospoblados.geojson muy grande');
    console.info('💡 Los centros poblados deben cargarse desde el API del backend');
    
    // Retornar estructura vacía en lugar de cargar el archivo
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  /**
   * Cargar localidades genéricas (desde API con caché)
   */
  async loadLocalidades(filters: {
    tipo?: string;
    provincia?: string;
    distrito?: string;
    activosSolo?: boolean;
  } = {}): Promise<any> {
    const cacheKey = GeojsonCacheService.generateKey('localidades', filters);
    
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.provincia) params.append('provincia', filters.provincia);
    if (filters.distrito) params.append('distrito', filters.distrito);
    if (filters.activosSolo !== undefined) params.append('activos_solo', String(filters.activosSolo));

    const url = `${this.API_BASE}/localidades/geojson?${params.toString()}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    this.cacheService.set(cacheKey, data, 'localidades');
    
    return data;
  }

  /**
   * Invalidar caché de centros poblados
   * Útil después de crear/editar/eliminar un centro poblado
   */
  invalidateCentrosPoblados(): void {
    this.cacheService.invalidatePattern('centros-poblados');
  }

  /**
   * Invalidar caché de localidades
   */
  invalidateLocalidades(): void {
    this.cacheService.invalidatePattern('localidades');
  }

  /**
   * Invalidar todo el caché GeoJSON
   */
  invalidateAll(): void {
    this.cacheService.invalidatePattern('geojson:');
    this.cacheService.invalidatePattern('centros-poblados');
    this.cacheService.invalidatePattern('localidades');
  }
}
