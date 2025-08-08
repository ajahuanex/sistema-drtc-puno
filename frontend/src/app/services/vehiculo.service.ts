import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Datos mock para desarrollo
  private mockVehiculos: Vehiculo[] = [
    {
      id: '1',
      placa: 'V1A-123',
      empresaActualId: '1',
      resolucionId: '1',
      rutasAsignadasIds: ['1', '2'],
      categoria: 'M3',
      marca: 'Mercedes-Benz',
      modelo: 'O500RS',
      anioFabricacion: 2018,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-123456-2025',
        fechaEmision: '2025-01-15T10:00:00Z'
      },
      datosTecnicos: {
        motor: 'ABC123456789',
        chasis: 'A123-B456-C789',
        cilindros: 6,
        ejes: 2,
        ruedas: 6,
        asientos: 30,
        pesoNeto: 8.500,
        pesoBruto: 16.000,
        medidas: {
          largo: 10.5,
          ancho: 2.5,
          alto: 3.2
        }
      }
    },
    {
      id: '2',
      placa: 'V2B-456',
      empresaActualId: '1',
      resolucionId: '1',
      rutasAsignadasIds: ['3'],
      categoria: 'M3',
      marca: 'Volvo',
      modelo: 'B12M',
      anioFabricacion: 2019,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-123457-2025',
        fechaEmision: '2025-02-20T14:30:00Z'
      },
      datosTecnicos: {
        motor: 'DEF456789012',
        chasis: 'D789-E012-F345',
        cilindros: 8,
        ejes: 2,
        ruedas: 6,
        asientos: 35,
        pesoNeto: 9.200,
        pesoBruto: 18.500,
        medidas: {
          largo: 11.0,
          ancho: 2.6,
          alto: 3.3
        }
      }
    },
    {
      id: '3',
      placa: 'V3C-789',
      empresaActualId: '2',
      resolucionId: '2',
      rutasAsignadasIds: ['4', '5'],
      categoria: 'N3',
      marca: 'Scania',
      modelo: 'G420',
      anioFabricacion: 2020,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-123458-2025',
        fechaEmision: '2025-03-10T09:15:00Z'
      },
      datosTecnicos: {
        motor: 'GHI789012345',
        chasis: 'G678-H901-I234',
        cilindros: 12,
        ejes: 3,
        ruedas: 10,
        asientos: 45,
        pesoNeto: 12.800,
        pesoBruto: 25.000,
        medidas: {
          largo: 12.5,
          ancho: 2.8,
          alto: 3.5
        }
      }
    }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  private getHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.authService.getAuthHeaders()
    });
    return headers;
  }

  getVehiculos(skip: number = 0, limit: number = 100, estado?: string): Observable<Vehiculo[]> {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo al login...');
      this.router.navigate(['/login']);
      return of([]);
    }

    let url = `${this.apiUrl}/vehiculos/?skip=${skip}&limit=${limit}`;
    if (estado) {
      url += `&estado=${estado}`;
    }
    
    const headers = this.getHeaders();
    console.log('Solicitando vehículos desde:', url);
    console.log('Headers de autenticación:', headers);
    
    return this.http.get<Vehiculo[]>(url, { headers }).pipe(
      catchError(error => {
        console.log('Error conectando al backend:', error);
        
        // Si es error 401, redirigir al login
        if (error.status === 401) {
          console.log('Error 401 - Usuario no autorizado, redirigiendo al login...');
          this.authService.logout();
          this.router.navigate(['/login']);
          return of([]);
        }
        
        // Para otros errores, usar datos mock
        console.log('Usando datos mock debido al error:', error.status);
        return of(this.mockVehiculos);
      })
    );
  }

  getVehiculoById(id: string): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error obteniendo vehículo por ID, usando datos mock:', error);
        const mockVehiculo = this.mockVehiculos.find(veh => veh.id === id);
        if (mockVehiculo) {
          return of(mockVehiculo);
        } else {
          throw new Error('Vehículo no encontrado');
        }
      })
    );
  }

  getVehiculoByPlaca(placa: string): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/placa/${placa}`, { headers: this.getHeaders() });
  }

  createVehiculo(vehiculo: VehiculoCreate): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehiculos/`, vehiculo, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error creando vehículo, simulando creación con datos mock:', error);
        // Simular creación exitosa
        const newVehiculo: Vehiculo = {
          id: (this.mockVehiculos.length + 1).toString(),
          placa: vehiculo.placa,
          empresaActualId: vehiculo.empresaActualId,
          resolucionId: vehiculo.resolucionId,
          rutasAsignadasIds: vehiculo.rutasAsignadasIds,
          categoria: vehiculo.categoria,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          anioFabricacion: vehiculo.anioFabricacion,
          estado: 'ACTIVO',
          estaActivo: true,
          datosTecnicos: vehiculo.datosTecnicos
        };
        this.mockVehiculos.push(newVehiculo);
        return of(newVehiculo);
      })
    );
  }

  updateVehiculo(id: string, vehiculo: VehiculoUpdate): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculo, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error actualizando vehículo, simulando actualización con datos mock:', error);
        // Simular actualización exitosa
        const mockVehiculo = this.mockVehiculos.find(v => v.id === id);
        if (mockVehiculo) {
          Object.assign(mockVehiculo, vehiculo);
          return of(mockVehiculo);
        } else {
          throw new Error('Vehículo no encontrado');
        }
      })
    );
  }

  deleteVehiculo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error eliminando vehículo, simulando eliminación con datos mock:', error);
        // Simular eliminación exitosa
        const index = this.mockVehiculos.findIndex(v => v.id === id);
        if (index !== -1) {
          this.mockVehiculos.splice(index, 1);
          return of(void 0);
        } else {
          throw new Error('Vehículo no encontrado');
        }
      })
    );
  }
} 