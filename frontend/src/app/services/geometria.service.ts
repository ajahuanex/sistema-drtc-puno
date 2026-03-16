import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GeometriaGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: any;
    properties: {
      id: string;
      nombre: string;
      tipo: string;
      ubigeo?: string;
      departamento?: string;
      provincia?: string;
      distrito?: string;
      area_km2?: number;
      [key: string]: any;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class GeometriaService {
  private apiUrl = `${environment.apiUrl}/geometrias`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener geometrías en formato GeoJSON con filtros
   */
  obtenerGeometriasGeoJSON(filtros?: {
    tipo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
  }): Observable<GeometriaGeoJSON> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.tipo) {
        params = params.set('tipo', filtros.tipo);
      }
      if (filtros.departamento) {
        params = params.set('departamento', filtros.departamento);
      }
      if (filtros.provincia) {
        params = params.set('provincia', filtros.provincia);
      }
      if (filtros.distrito) {
        params = params.set('distrito', filtros.distrito);
      }
    }

    return this.http.get<GeometriaGeoJSON>(`${this.apiUrl}/geojson`, { params });
  }

  /**
   * Obtener provincias de un departamento
   */
  obtenerProvincias(departamento: string = 'PUNO'): Observable<GeometriaGeoJSON> {
    return this.obtenerGeometriasGeoJSON({
      tipo: 'PROVINCIA',
      departamento
    });
  }

  /**
   * Obtener distritos de una provincia
   */
  obtenerDistritos(provincia: string, departamento: string = 'PUNO'): Observable<GeometriaGeoJSON> {
    return this.obtenerGeometriasGeoJSON({
      tipo: 'DISTRITO',
      departamento,
      provincia
    });
  }

  /**
   * Obtener un distrito específico
   */
  obtenerDistrito(distrito: string, provincia: string, departamento: string = 'PUNO'): Observable<GeometriaGeoJSON> {
    return this.obtenerGeometriasGeoJSON({
      tipo: 'DISTRITO',
      departamento,
      provincia,
      distrito
    });
  }

  /**
   * Obtener centros poblados de un distrito
   */
  obtenerCentrosPoblados(distrito: string, provincia: string, departamento: string = 'PUNO'): Observable<GeometriaGeoJSON> {
    return this.obtenerGeometriasGeoJSON({
      tipo: 'CENTRO_POBLADO',
      departamento,
      provincia,
      distrito
    });
  }

  /**
   * Obtener puntos de referencia de provincias
   */
  obtenerProvinciasPoint(departamento: string = 'PUNO'): Observable<GeometriaGeoJSON> {
    return this.obtenerGeometriasGeoJSON({
      tipo: 'PROVINCIA_POINT',
      departamento
    });
  }

  /**
   * Obtener puntos de referencia de distritos
   */
  obtenerDistritosPoint(provincia: string, departamento: string = 'PUNO'): Observable<GeometriaGeoJSON> {
    return this.obtenerGeometriasGeoJSON({
      tipo: 'DISTRITO_POINT',
      departamento,
      provincia
    });
  }

  /**
   * Obtener localidades como puntos en formato GeoJSON
   */
  obtenerLocalidadesGeoJSON(filtros?: {
    tipo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    esta_activa?: boolean;
  }): Observable<GeometriaGeoJSON> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.tipo) {
        params = params.set('tipo', filtros.tipo);
      }
      if (filtros.departamento) {
        params = params.set('departamento', filtros.departamento);
      }
      if (filtros.provincia) {
        params = params.set('provincia', filtros.provincia);
      }
      if (filtros.distrito) {
        params = params.set('distrito', filtros.distrito);
      }
      if (filtros.esta_activa !== undefined) {
        params = params.set('esta_activa', filtros.esta_activa.toString());
      }
    }

    return this.http.get<GeometriaGeoJSON>(`${environment.apiUrl}/localidades/export/geojson`, { params });
  }
}
