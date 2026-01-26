import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Localidad, 
  LocalidadCreate, 
  LocalidadUpdate, 
  LocalidadesPaginadas, 
  FiltroLocalidades,
  ValidacionUbigeo,
  RespuestaValidacionUbigeo,
  TipoLocalidad,
  NivelTerritorial
} from '../models/localidad.model';

@Injectable({
  providedIn: 'root'
})
export class LocalidadService {
  private apiUrl = environment.apiUrl + '/localidades';

  constructor(private http: HttpClient) {}

  // Métodos de compatibilidad con el código existente
  getLocalidades(): Observable<Localidad[]> {
    return this.http.get<Localidad[]>(this.apiUrl);
  }

  getLocalidadesActivas(): Observable<Localidad[]> {
    return this.http.get<Localidad[]>(`${this.apiUrl}/activas`);
  }

  async obtenerLocalidades(filtros?: FiltroLocalidades): Promise<Localidad[]> {
    try {
      let params = new HttpParams();
      
      if (filtros) {
        if (filtros.nombre) params = params.set('nombre', filtros.nombre);
        if (filtros.tipo) params = params.set('tipo', filtros.tipo);
        if (filtros.departamento) params = params.set('departamento', filtros.departamento);
        if (filtros.provincia) params = params.set('provincia', filtros.provincia);
        if (filtros.nivel_territorial) params = params.set('nivel_territorial', filtros.nivel_territorial);
        if (filtros.esta_activa !== undefined) params = params.set('esta_activa', filtros.esta_activa.toString());
      }

      const result = await this.http.get<Localidad[]>(this.apiUrl, { params }).toPromise();
      return result || [];
    } catch (error) {
      console.warn('⚠️ Error obteniendo localidades del backend, usando datos por defecto:', error);
      
      // Retornar localidades por defecto para Puno
      return this.getLocalidadesPorDefecto();
    }
  }

  private getLocalidadesPorDefecto(): Localidad[] {
    return [
      {
        id: 'default-puno',
        nombre: 'PUNO',
        ubigeo: '210101',
        tipo: TipoLocalidad.CIUDAD,
        nivel_territorial: NivelTerritorial.DISTRITO,
        departamento: 'PUNO',
        provincia: 'PUNO',
        distrito: 'PUNO',
        municipalidad_centro_poblado: 'PUNO',
        coordenadas: { latitud: -15.8422, longitud: -70.0199 },
        esta_activa: true,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      {
        id: 'default-juliaca',
        nombre: 'JULIACA',
        ubigeo: '210801',
        tipo: TipoLocalidad.CIUDAD,
        nivel_territorial: NivelTerritorial.DISTRITO,
        departamento: 'PUNO',
        provincia: 'SAN ROMAN',
        distrito: 'JULIACA',
        municipalidad_centro_poblado: 'JULIACA',
        coordenadas: { latitud: -15.5000, longitud: -70.1333 },
        esta_activa: true,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      {
        id: 'default-arequipa',
        nombre: 'AREQUIPA',
        ubigeo: '040101',
        tipo: TipoLocalidad.CIUDAD,
        nivel_territorial: NivelTerritorial.DISTRITO,
        departamento: 'AREQUIPA',
        provincia: 'AREQUIPA',
        distrito: 'AREQUIPA',
        municipalidad_centro_poblado: 'AREQUIPA',
        coordenadas: { latitud: -16.4090, longitud: -71.5375 },
        esta_activa: true,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      {
        id: 'default-cusco',
        nombre: 'CUSCO',
        ubigeo: '080101',
        tipo: TipoLocalidad.CIUDAD,
        nivel_territorial: NivelTerritorial.DISTRITO,
        departamento: 'CUSCO',
        provincia: 'CUSCO',
        distrito: 'CUSCO',
        municipalidad_centro_poblado: 'CUSCO',
        coordenadas: { latitud: -13.5319, longitud: -71.9675 },
        esta_activa: true,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      {
        id: 'default-lima',
        nombre: 'LIMA',
        ubigeo: '150101',
        tipo: TipoLocalidad.CIUDAD,
        nivel_territorial: NivelTerritorial.DISTRITO,
        departamento: 'LIMA',
        provincia: 'LIMA',
        distrito: 'LIMA',
        municipalidad_centro_poblado: 'LIMA',
        coordenadas: { latitud: -12.0464, longitud: -77.0428 },
        esta_activa: true,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      }
    ];
  }

  async obtenerLocalidadesPaginadas(
    pagina: number = 1, 
    limite: number = 10, 
    filtros?: FiltroLocalidades
  ): Promise<LocalidadesPaginadas> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());
    
    if (filtros) {
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.tipo) params = params.set('tipo', filtros.tipo);
      if (filtros.departamento) params = params.set('departamento', filtros.departamento);
      if (filtros.provincia) params = params.set('provincia', filtros.provincia);
      if (filtros.nivel_territorial) params = params.set('nivel_territorial', filtros.nivel_territorial);
      if (filtros.esta_activa !== undefined) params = params.set('esta_activa', filtros.esta_activa.toString());
    }

    return this.http.get<LocalidadesPaginadas>(`${this.apiUrl}/paginadas`, { params }).toPromise() as Promise<LocalidadesPaginadas>;
  }

  async obtenerLocalidadPorId(id: string): Promise<Localidad> {
    return this.http.get<Localidad>(`${this.apiUrl}/${id}`).toPromise() as Promise<Localidad>;
  }

  async crearLocalidad(localidad: LocalidadCreate): Promise<Localidad> {
    return this.http.post<Localidad>(this.apiUrl, localidad).toPromise() as Promise<Localidad>;
  }

  async actualizarLocalidad(id: string, localidad: LocalidadUpdate): Promise<Localidad> {
    return this.http.put<Localidad>(`${this.apiUrl}/${id}`, localidad).toPromise() as Promise<Localidad>;
  }

  async eliminarLocalidad(id: string): Promise<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
  }

  async toggleEstadoLocalidad(id: string): Promise<Localidad> {
    return this.http.patch<Localidad>(`${this.apiUrl}/${id}/toggle-estado`, {}).toPromise() as Promise<Localidad>;
  }

  // Búsqueda
  async buscarLocalidades(termino: string): Promise<Localidad[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Localidad[]>(`${this.apiUrl}/buscar`, { params }).toPromise() as Promise<Localidad[]>;
  }

  async obtenerLocalidadesActivas(): Promise<Localidad[]> {
    try {
      const result = await this.http.get<Localidad[]>(`${this.apiUrl}/activas`).toPromise();
      return result || [];
    } catch (error) {
      console.warn('⚠️ Error obteniendo localidades activas del backend, usando datos por defecto:', error);
      return this.getLocalidadesPorDefecto().filter(l => l.esta_activa);
    }
  }

  // Validaciones
  async validarUbigeoUnico(ubigeo: string, idExcluir?: string): Promise<RespuestaValidacionUbigeo> {
    const validacion: ValidacionUbigeo = { ubigeo, idExcluir };
    return this.http.post<RespuestaValidacionUbigeo>(`${this.apiUrl}/validar-ubigeo`, validacion).toPromise() as Promise<RespuestaValidacionUbigeo>;
  }

  // Operaciones masivas
  async operacionesMasivas(operacion: 'activar' | 'desactivar' | 'eliminar', ids: string[]): Promise<any> {
    let params = new HttpParams()
      .set('operacion', operacion);
    
    ids.forEach(id => {
      params = params.append('ids', id);
    });

    return this.http.post(`${this.apiUrl}/operaciones-masivas`, null, { params }).toPromise();
  }

  // Importación y exportación
  async importarExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/importar-excel`, formData).toPromise();
  }

  async exportarExcel(): Promise<void> {
    const response = await this.http.get(`${this.apiUrl}/exportar-excel`, { 
      responseType: 'blob' 
    }).toPromise() as Blob;

    // Crear y descargar archivo
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generar nombre con timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `localidades_${timestamp}.xlsx`;
    
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Utilidades
  async calcularDistancia(origenId: string, destinoId: string): Promise<{ distancia: number; unidad: string }> {
    return this.http.get<{ distancia: number; unidad: string }>(`${this.apiUrl}/${origenId}/distancia/${destinoId}`).toPromise() as Promise<{ distancia: number; unidad: string }>;
  }

  async inicializarLocalidadesDefault(): Promise<any> {
    return this.http.post(`${this.apiUrl}/inicializar`, {}).toPromise();
  }
}