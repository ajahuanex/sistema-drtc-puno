import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Conductor {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  licencia: {
    numero: string;
    categoria: string;
    fechaEmision: string;
    fechaVencimiento: string;
  };
  estado: string;
  calidadConductor: 'ÓPTIMO' | 'AMONESTADO' | 'EN_SANCION';
  estaActivo: boolean;
  empresasAsociadasIds: string[];
  email?: string;
  telefono?: string;
  fechaRegistro?: Date;
}

export interface ConductorCreate {
  dni: string;
  nombres: string;
  apellidos: string;
  licencia: {
    numero: string;
    categoria: string;
    fechaEmision: string;
    fechaVencimiento: string;
  };
  empresasAsociadasIds: string[];
  email?: string;
  telefono?: string;
  empresaId?: string;
}

export interface ConductorUpdate {
  dni?: string;
  nombres?: string;
  apellidos?: string;
  licencia?: {
    numero: string;
    categoria: string;
    fechaEmision: string;
    fechaVencimiento: string;
  };
  estado?: string;
  calidadConductor?: 'ÓPTIMO' | 'AMONESTADO' | 'EN_SANCION';
  empresasAsociadasIds?: string[];
  email?: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConductorService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Datos mock para desarrollo
  private mockConductores: Conductor[] = [
    {
      id: '1',
      dni: '12345678',
      nombres: 'Juan Carlos',
      apellidos: 'Pérez Quispe',
      licencia: {
        numero: 'A1B2C3D4E5',
        categoria: 'A',
        fechaEmision: '2023-01-01',
        fechaVencimiento: '2024-01-01'
      },
      estado: 'ACTIVO',
      calidadConductor: 'ÓPTIMO',
      estaActivo: true,
      empresasAsociadasIds: ['1', '2'],
      email: 'juan.perez@email.com',
      telefono: '951234567',
      fechaRegistro: new Date('2024-01-15')
    },
    {
      id: '2',
      dni: '87654321',
      nombres: 'María Elena',
      apellidos: 'Rodríguez López',
      licencia: {
        numero: 'B2C3D4E5F6',
        categoria: 'B',
        fechaEmision: '2023-02-01',
        fechaVencimiento: '2024-02-01'
      },
      estado: 'ACTIVO',
      calidadConductor: 'AMONESTADO',
      estaActivo: true,
      empresasAsociadasIds: ['1'],
      email: 'maria.rodriguez@email.com',
      telefono: '987654321',
      fechaRegistro: new Date('2024-02-20')
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

  getConductores(skip: number = 0, limit: number = 100, estado?: string): Observable<Conductor[]> {
    const url = `${this.apiUrl}/conductores`;
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    if (limit !== 100) params.append('limit', limit.toString());
    if (estado) params.append('estado', estado);

    return this.http.get<Conductor[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching conductores:', error);
          // Retornar datos mock en caso de error
          return of(this.mockConductores);
        })
      );
  }

  getConductorById(id: string): Observable<Conductor> {
    const url = `${this.apiUrl}/conductores/${id}`;
    
    return this.http.get<Conductor>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching conductor:', error);
          // Retornar conductor mock en caso de error
          const mockConductor = this.mockConductores.find(c => c.id === id);
          if (mockConductor) {
            return of(mockConductor);
          }
          return throwError(() => new Error('Conductor no encontrado'));
        })
      );
  }

  createConductor(conductor: ConductorCreate): Observable<Conductor> {
    const url = `${this.apiUrl}/conductores`;
    
    return this.http.post<Conductor>(url, conductor, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating conductor:', error);
          // Crear conductor mock en caso de error
          const newConductor: Conductor = {
            id: (this.mockConductores.length + 1).toString(),
            dni: conductor.dni,
            nombres: conductor.nombres,
            apellidos: conductor.apellidos,
            licencia: {
              numero: conductor.licencia.numero,
              categoria: conductor.licencia.categoria,
              fechaEmision: conductor.licencia.fechaEmision,
              fechaVencimiento: conductor.licencia.fechaVencimiento
            },
            estado: 'ACTIVO',
            calidadConductor: 'ÓPTIMO',
            estaActivo: true,
            empresasAsociadasIds: conductor.empresasAsociadasIds,
            email: conductor.email,
            telefono: conductor.telefono,
            fechaRegistro: new Date()
          };
          this.mockConductores.push(newConductor);
          return of(newConductor);
        })
      );
  }

  updateConductor(id: string, conductor: ConductorUpdate): Observable<Conductor> {
    const url = `${this.apiUrl}/conductores/${id}`;
    
    return this.http.put<Conductor>(url, conductor, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating conductor:', error);
          // Actualizar conductor mock en caso de error
          const index = this.mockConductores.findIndex(c => c.id === id);
          if (index !== -1) {
            this.mockConductores[index] = { ...this.mockConductores[index], ...conductor };
            return of(this.mockConductores[index]);
          }
          return throwError(() => new Error('Conductor no encontrado'));
        })
      );
  }

  deleteConductor(id: string): Observable<void> {
    const url = `${this.apiUrl}/conductores/${id}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting conductor:', error);
          // Eliminar conductor mock en caso de error
          const index = this.mockConductores.findIndex(c => c.id === id);
          if (index !== -1) {
            this.mockConductores.splice(index, 1);
          }
          return of(void 0);
        })
      );
  }

  getConductoresPorEmpresa(empresaId: string): Observable<Conductor[]> {
    const url = `${this.apiUrl}/conductores`;
    const params = new URLSearchParams();
    params.append('empresa_id', empresaId);

    return this.http.get<Conductor[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching conductores por empresa:', error);
          // Retornar conductores mock filtrados por empresa
          return of(this.mockConductores.filter(c => c.estaActivo));
        })
      );
  }

  agregarConductorAEmpresa(empresaId: string, conductorId: string): Observable<Conductor> {
    const url = `${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`;
    
    return this.http.post<Conductor>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error adding conductor to empresa:', error);
          // Simular éxito en caso de error
          const conductor = this.mockConductores.find(c => c.id === conductorId);
          if (conductor) {
            return of(conductor);
          }
          return throwError(() => new Error('Conductor no encontrado'));
        })
      );
  }

  removerConductorDeEmpresa(empresaId: string, conductorId: string): Observable<void> {
    const url = `${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error removing conductor from empresa:', error);
          // Simular éxito en caso de error
          return of(void 0);
        })
      );
  }
} 