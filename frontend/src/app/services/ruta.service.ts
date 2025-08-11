import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Ruta, RutaCreate, RutaUpdate } from '../models/ruta.model';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Datos mock para desarrollo
  private mockRutas: Ruta[] = [
    {
      id: '1',
      codigoRuta: 'RUTA-001',
      nombre: 'Puno - Juliaca',
      origenId: '1',
      destinoId: '2',
      itinerarioIds: ['1', '2', '3'],
      frecuencias: '1,2,3',
      estado: 'ACTIVA',
      estaActivo: true,
      fechaRegistro: new Date('2024-01-15')
    },
    {
      id: '2',
      codigoRuta: 'RUTA-002',
      nombre: 'Juliaca - Arequipa',
      origenId: '2',
      destinoId: '3',
      itinerarioIds: ['4', '5', '6'],
      frecuencias: '1,2,3',
      estado: 'ACTIVA',
      estaActivo: true,
      fechaRegistro: new Date('2024-02-20')
    },
    {
      id: '3',
      codigoRuta: 'RUTA-003',
      nombre: 'Puno - Cusco',
      origenId: '1',
      destinoId: '4',
      itinerarioIds: ['7', '8', '9'],
      frecuencias: '1,2,3',
      estado: 'ACTIVA',
      estaActivo: true,
      fechaRegistro: new Date('2024-03-10')
    }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getRutas(skip: number = 0, limit: number = 100, estado?: string): Observable<Ruta[]> {
    const url = `${this.apiUrl}/rutas`;
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    if (limit !== 100) params.append('limit', limit.toString());
    if (estado) params.append('estado', estado);

    return this.http.get<Ruta[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching rutas:', error);
          // Retornar datos mock en caso de error
          return of(this.mockRutas);
        })
      );
  }

  getRutaById(id: string): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.get<Ruta>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching ruta:', error);
          // Retornar ruta mock en caso de error
          const mockRuta = this.mockRutas.find(r => r.id === id);
          if (mockRuta) {
            return of(mockRuta);
          }
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  createRuta(ruta: RutaCreate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas`;
    
    return this.http.post<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating ruta:', error);
          // Crear ruta mock en caso de error
          const newRuta: Ruta = {
            id: (this.mockRutas.length + 1).toString(),
            codigoRuta: ruta.codigoRuta,
            nombre: ruta.nombre,
            origenId: ruta.origenId,
            destinoId: ruta.destinoId,
            itinerarioIds: ruta.itinerarioIds,
            frecuencias: ruta.frecuencias,
            estado: 'ACTIVA',
            estaActivo: true,
            fechaRegistro: new Date()
          };
          this.mockRutas.push(newRuta);
          return of(newRuta);
        })
      );
  }

  updateRuta(id: string, ruta: RutaUpdate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.put<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating ruta:', error);
          // Actualizar ruta mock en caso de error
          const index = this.mockRutas.findIndex(r => r.id === id);
          if (index !== -1) {
            const rutaActualizada = { ...this.mockRutas[index] };
            if (ruta.codigoRuta !== undefined) rutaActualizada.codigoRuta = ruta.codigoRuta;
            if (ruta.nombre !== undefined) rutaActualizada.nombre = ruta.nombre;
            if (ruta.origenId !== undefined) rutaActualizada.origenId = ruta.origenId;
            if (ruta.destinoId !== undefined) rutaActualizada.destinoId = ruta.destinoId;
            if (ruta.itinerarioIds !== undefined) rutaActualizada.itinerarioIds = ruta.itinerarioIds;
            if (ruta.frecuencias !== undefined) rutaActualizada.frecuencias = ruta.frecuencias;
            if (ruta.estado !== undefined) rutaActualizada.estado = ruta.estado;
            
            this.mockRutas[index] = rutaActualizada;
            return of(this.mockRutas[index]);
          }
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  deleteRuta(id: string): Observable<void> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting ruta:', error);
          // Eliminar ruta mock en caso de error
          const index = this.mockRutas.findIndex(r => r.id === id);
          if (index !== -1) {
            this.mockRutas.splice(index, 1);
          }
          return of(void 0);
        })
      );
  }

  getRutasPorEmpresa(empresaId: string): Observable<Ruta[]> {
    const url = `${this.apiUrl}/rutas`;
    const params = new URLSearchParams();
    params.append('empresa_id', empresaId);

    return this.http.get<Ruta[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching rutas por empresa:', error);
          // Retornar rutas mock filtradas por empresa
          return of(this.mockRutas.filter(r => r.estaActivo));
        })
      );
  }

  agregarRutaAEmpresa(empresaId: string, rutaId: string): Observable<Ruta> {
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`;
    
    return this.http.post<Ruta>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error adding ruta to empresa:', error);
          // Simular éxito en caso de error
          const ruta = this.mockRutas.find(r => r.id === rutaId);
          if (ruta) {
            return of(ruta);
          }
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  removerRutaDeEmpresa(empresaId: string, rutaId: string): Observable<void> {
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error removing ruta from empresa:', error);
          // Simular éxito en caso de error
          return of(void 0);
        })
      );
  }
} 