import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Localidad } from '../models/ruta.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocalidadService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/localidades';

  // Datos mock para desarrollo
  private mockLocalidades: Localidad[] = [
    {
      id: '1',
      nombre: 'PUNO',
      codigo: 'PUN',
      tipo: 'CIUDAD',
      departamento: 'PUNO',
      provincia: 'PUNO',
      distrito: 'PUNO',
      coordenadas: { latitud: -15.8402, longitud: -70.0219 },
      estaActiva: true
    },
    {
      id: '2',
      nombre: 'JULIACA',
      codigo: 'JUL',
      tipo: 'CIUDAD',
      departamento: 'PUNO',
      provincia: 'SAN ROMÁN',
      distrito: 'JULIACA',
      coordenadas: { latitud: -15.4997, longitud: -70.1333 },
      estaActiva: true
    },
    {
      id: '3',
      nombre: 'AREQUIPA',
      codigo: 'ARE',
      tipo: 'CIUDAD',
      departamento: 'AREQUIPA',
      provincia: 'AREQUIPA',
      distrito: 'AREQUIPA',
      coordenadas: { latitud: -16.4090, longitud: -71.5375 },
      estaActiva: true
    },
    {
      id: '4',
      nombre: 'CUSCO',
      codigo: 'CUS',
      tipo: 'CIUDAD',
      departamento: 'CUSCO',
      provincia: 'CUSCO',
      distrito: 'CUSCO',
      coordenadas: { latitud: -13.5167, longitud: -71.9789 },
      estaActiva: true
    },
    {
      id: '5',
      nombre: 'LIMA',
      codigo: 'LIM',
      tipo: 'CIUDAD',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'LIMA',
      coordenadas: { latitud: -12.0464, longitud: -77.0428 },
      estaActiva: true
    },
    {
      id: '6',
      nombre: 'MOQUEGUA',
      codigo: 'MOQ',
      tipo: 'CIUDAD',
      departamento: 'MOQUEGUA',
      provincia: 'MOQUEGUA',
      distrito: 'MOQUEGUA',
      coordenadas: { latitud: -17.1956, longitud: -70.9356 },
      estaActiva: true
    },
    {
      id: '7',
      nombre: 'TACNA',
      codigo: 'TAC',
      tipo: 'CIUDAD',
      departamento: 'TACNA',
      provincia: 'TACNA',
      distrito: 'TACNA',
      coordenadas: { latitud: -18.0120, longitud: -70.2520 },
      estaActiva: true
    },
    {
      id: '8',
      nombre: 'AYAVIRI',
      codigo: 'AYA',
      tipo: 'PUEBLO',
      departamento: 'PUNO',
      provincia: 'MELGAR',
      distrito: 'AYAVIRI',
      coordenadas: { latitud: -14.8861, longitud: -70.5889 },
      estaActiva: true
    },
    {
      id: '9',
      nombre: 'AZÁNGARO',
      codigo: 'AZA',
      tipo: 'CIUDAD',
      departamento: 'PUNO',
      provincia: 'AZÁNGARO',
      distrito: 'AZÁNGARO',
      coordenadas: { latitud: -14.9083, longitud: -70.1967 },
      estaActiva: true
    },
    {
      id: '10',
      nombre: 'ILAVE',
      codigo: 'ILA',
      tipo: 'CIUDAD',
      departamento: 'PUNO',
      provincia: 'EL COLLAO',
      distrito: 'ILAVE',
      coordenadas: { latitud: -16.0833, longitud: -69.6667 },
      estaActiva: true
    }
  ];



  private getHeaders(): any {
    // En desarrollo, no necesitamos headers reales
    return {};
  }

  getLocalidades(skip: number = 0, limit: number = 100, departamento?: string, provincia?: string): Observable<Localidad[]> {
    // Usar directamente datos mock para desarrollo
    let localidades = this.mockLocalidades;
    
    if (departamento) {
      localidades = localidades.filter(l => l.departamento === departamento);
    }
    
    if (provincia) {
      localidades = localidades.filter(l => l.provincia === provincia);
    }
    
    return of(localidades.slice(skip, skip + limit));
  }

  getLocalidadById(id: string): Observable<Localidad> {
    // Usar directamente datos mock para desarrollo
    const mockLocalidad = this.mockLocalidades.find(l => l.id === id);
    if (mockLocalidad) {
      return of(mockLocalidad);
    }
    
    // Solo hacer llamada HTTP si no se encuentra en mock
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.get<Localidad>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching localidad:', error);
          return throwError(() => new Error('Localidad no encontrada'));
        })
      );
  }

  getLocalidadesPorDepartamento(departamento: string): Observable<Localidad[]> {
    const url = `${this.apiUrl}`;
    const params = new URLSearchParams();
    params.append('departamento', departamento);

    return this.http.get<Localidad[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching localidades por departamento:', error);
          // Retornar localidades mock filtradas por departamento
          return of(this.mockLocalidades.filter(l => l.departamento === departamento));
        })
      );
  }

  getLocalidadesPorProvincia(provincia: string): Observable<Localidad[]> {
    const url = `${this.apiUrl}`;
    const params = new URLSearchParams();
    params.append('provincia', provincia);

    return this.http.get<Localidad[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching localidades por provincia:', error);
          // Retornar localidades mock filtradas por provincia
          return of(this.mockLocalidades.filter(l => l.provincia === provincia));
        })
      );
  }

  buscarLocalidades(termino: string): Observable<Localidad[]> {
    const url = `${this.apiUrl}/buscar`;
    const params = new URLSearchParams();
    params.append('q', termino);

    return this.http.get<Localidad[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error searching localidades:', error);
          // Buscar en datos mock
          const terminoLower = termino.toLowerCase();
          const localidadesEncontradas = this.mockLocalidades.filter(l => 
            l.nombre.toLowerCase().includes(terminoLower) ||
            l.codigo.toLowerCase().includes(terminoLower) ||
            l.departamento.toLowerCase().includes(terminoLower) ||
            l.provincia.toLowerCase().includes(terminoLower)
          );
          return of(localidadesEncontradas);
        })
      );
  }

  createLocalidad(localidad: Omit<Localidad, 'id'>): Observable<Localidad> {
    const url = `${this.apiUrl}`;
    
    return this.http.post<Localidad>(url, localidad, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating localidad:', error);
          // Crear localidad mock en caso de error
          const newLocalidad: Localidad = {
            id: (this.mockLocalidades.length + 1).toString(),
            ...localidad
          };
          this.mockLocalidades.push(newLocalidad);
          return of(newLocalidad);
        })
      );
  }

  updateLocalidad(id: string, localidad: Partial<Localidad>): Observable<Localidad> {
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.put<Localidad>(url, localidad, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating localidad:', error);
          // Actualizar localidad mock en caso de error
          const index = this.mockLocalidades.findIndex(l => l.id === id);
          if (index !== -1) {
            this.mockLocalidades[index] = { ...this.mockLocalidades[index], ...localidad };
            return of(this.mockLocalidades[index]);
          }
          return throwError(() => new Error('Localidad no encontrada'));
        })
      );
  }

  deleteLocalidad(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting localidad:', error);
          // Eliminar localidad mock en caso de error
          const index = this.mockLocalidades.findIndex(l => l.id === id);
          if (index !== -1) {
            this.mockLocalidades.splice(index, 1);
          }
          return of(void 0);
        })
      );
  }

  // Método para obtener localidades activas para formularios
  getLocalidadesActivas(): Observable<Localidad[]> {
    return this.getLocalidades().pipe(
      map(localidades => localidades.filter(l => l.estaActiva))
    );
  }

  // Método para calcular distancia entre dos localidades
  calcularDistancia(origenId: string, destinoId: string): Observable<number> {
    const origen = this.mockLocalidades.find(l => l.id === origenId);
    const destino = this.mockLocalidades.find(l => l.id === destinoId);
    
    if (!origen || !destino) {
      return throwError(() => new Error('Localidades no encontradas'));
    }

    // Cálculo simple de distancia usando coordenadas (fórmula de Haversine)
    if (origen.coordenadas && destino.coordenadas) {
      const distancia = this.calcularDistanciaHaversine(
        origen.coordenadas.latitud, origen.coordenadas.longitud,
        destino.coordenadas.latitud, destino.coordenadas.longitud
      );
      return of(distancia);
    }

    // Si no hay coordenadas, usar distancias predefinidas
    const distanciasPredefinidas: { [key: string]: number } = {
      '1-2': 45,  // PUNO - JULIACA: 45 km
      '1-3': 320, // PUNO - AREQUIPA: 320 km
      '1-4': 380, // PUNO - CUSCO: 380 km
      '2-3': 275, // JULIACA - AREQUIPA: 275 km
      '2-4': 335, // JULIACA - CUSCO: 335 km
      '3-4': 450, // AREQUIPA - CUSCO: 450 km
      '5-1': 1300, // LIMA - PUNO: 1300 km
      '5-2': 1255, // LIMA - JULIACA: 1255 km
      '5-3': 980,  // LIMA - AREQUIPA: 980 km
      '5-4': 1100, // LIMA - CUSCO: 1100 km
    };

    const key = `${origenId}-${destinoId}`;
    const keyReverse = `${destinoId}-${origenId}`;
    
    const distancia = distanciasPredefinidas[key] || distanciasPredefinidas[keyReverse] || 100;
    return of(distancia);
  }

  private calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 
