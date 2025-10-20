import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { AuthService } from './auth.service';

// Interfaces para carga masiva
interface VehiculoValidacion {
  fila: number;
  placa: string;
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

interface CargaMasivaResponse {
  total_procesados: number;
  exitosos: number;
  errores: number;
  vehiculos_creados: string[];
  errores_detalle: {
    fila: number;
    placa: string;
    errores: string[];
  }[];
}

interface EstadisticasCargaMasiva {
  total_cargas: number;
  vehiculos_cargados_total: number;
  ultima_carga: string;
  promedio_exitosos: number;
  errores_comunes: {
    error: string;
    frecuencia: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Datos mock para desarrollo con lógica de dependencias coherente
  private mockVehiculos: Vehiculo[] = [
    // ===== EMPRESA 1: TRANSPORTES PUNO S.A.C. =====
    // Resolución 1 (PRIMIGENIA) - Vehículos de pasajeros
    
    {
      id: '1',
      placa: 'PUN-001',
      empresaActualId: '1',
      resolucionId: '1',
      rutasAsignadasIds: ['1', '2'], // PUNO-JULIACA, PUNO-CUSCO
      categoria: 'M3',
      marca: 'MERCEDES-BENZ',
      modelo: 'O500RS',
      anioFabricacion: 2018,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001234-2025',
        fechaEmision: '2025-01-15T10:00:00Z'
      },
      datosTecnicos: {
        motor: 'MB-OM457LA.6/2',
        chasis: 'WDB9066131L123456',
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
      placa: 'PUN-002',
      empresaActualId: '1',
      resolucionId: '1',
      rutasAsignadasIds: ['3'], // PUNO-MOQUEGUA
      categoria: 'M3',
      marca: 'VOLVO',
      modelo: 'B12M',
      anioFabricacion: 2019,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001235-2025',
        fechaEmision: '2025-02-20T14:30:00Z'
      },
      datosTecnicos: {
        motor: 'VOLVO-D12C380',
        chasis: 'YV3R7C1234A123456',
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
      placa: 'PUN-003',
      empresaActualId: '1',
      resolucionId: '1',
      rutasAsignadasIds: ['1'], // Solo PUNO-JULIACA
      categoria: 'M2',
      marca: 'MERCEDES-BENZ',
      modelo: 'SPRINTER',
      anioFabricacion: 2020,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001236-2025',
        fechaEmision: '2025-03-10T09:15:00Z'
      },
      datosTecnicos: {
        motor: 'MB-OM651.951',
        chasis: 'WDB9066131L789012',
        cilindros: 4,
        ejes: 2,
        ruedas: 4,
        asientos: 16,
        pesoNeto: 3.200,
        pesoBruto: 6.500,
        medidas: {
          largo: 6.8,
          ancho: 2.0,
          alto: 2.8
        }
      }
    },

    // Resolución 2 (RENOVACION) - Vehículos de pasajeros adicionales
    {
      id: '4',
      placa: 'PUN-004',
      empresaActualId: '1',
      resolucionId: '2',
      rutasAsignadasIds: ['2', '3'], // PUNO-CUSCO, PUNO-MOQUEGUA
      categoria: 'M3',
      marca: 'SCANIA',
      modelo: 'K320',
      anioFabricacion: 2021,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001237-2025',
        fechaEmision: '2025-04-15T11:00:00Z'
      },
      datosTecnicos: {
        motor: 'SCANIA-DC13-320',
        chasis: 'XLE4X2HZ3PZ123456',
        cilindros: 6,
        ejes: 2,
        ruedas: 6,
        asientos: 32,
        pesoNeto: 8.800,
        pesoBruto: 17.200,
        medidas: {
          largo: 10.8,
          ancho: 2.5,
          alto: 3.1
        }
      }
    },

    // ===== EMPRESA 2: EMPRESA DE TRANSPORTES JULIACA E.I.R.L. =====
    // Resolución 3 (PRIMIGENIA) - Vehículos de carga
    
    {
      id: '5',
      placa: 'JUL-001',
      empresaActualId: '2',
      resolucionId: '3',
      rutasAsignadasIds: ['4'], // JULIACA-LIMA
      categoria: 'N3',
      marca: 'SCANIA',
      modelo: 'G420',
      anioFabricacion: 2019,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001238-2025',
        fechaEmision: '2025-01-20T08:00:00Z'
      },
      datosTecnicos: {
        motor: 'SCANIA-DC13-420',
        chasis: 'XLE6X2HZ3PZ123456',
        cilindros: 12,
        ejes: 3,
        ruedas: 10,
        asientos: 2,
        pesoNeto: 12.500,
        pesoBruto: 25.000,
        medidas: {
          largo: 13.5,
          ancho: 2.6,
          alto: 3.8
        }
      }
    },
    {
      id: '6',
      placa: 'JUL-002',
      empresaActualId: '2',
      resolucionId: '3',
      rutasAsignadasIds: ['5'], // JULIACA-AREQUIPA
      categoria: 'N2',
      marca: 'ISUZU',
      modelo: 'NQR75K',
      anioFabricacion: 2020,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001239-2025',
        fechaEmision: '2025-02-25T15:30:00Z'
      },
      datosTecnicos: {
        motor: 'ISUZU-4HK1-TC',
        chasis: 'JALLNQR75K1234567',
        cilindros: 4,
        ejes: 2,
        ruedas: 6,
        asientos: 3,
        pesoNeto: 4.800,
        pesoBruto: 12.000,
        medidas: {
          largo: 7.2,
          ancho: 2.3,
          alto: 2.9
        }
      }
    },

    // ===== EMPRESA 3: TRANSPORTES CUSCO S.A. =====
    // Resolución 4 (PRIMIGENIA) - Vehículos mixtos
    
    {
      id: '7',
      placa: 'CUS-001',
      empresaActualId: '3',
      resolucionId: '4',
      rutasAsignadasIds: ['6', '7'], // CUSCO-PUNO, CUSCO-AREQUIPA
      categoria: 'M3',
      marca: 'MERCEDES-BENZ',
      modelo: 'O500U',
      anioFabricacion: 2020,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001240-2025',
        fechaEmision: '2025-03-01T12:00:00Z'
      },
      datosTecnicos: {
        motor: 'MB-OM457LA.6/2',
        chasis: 'WDB9066131L345678',
        cilindros: 6,
        ejes: 2,
        ruedas: 6,
        asientos: 28,
        pesoNeto: 8.200,
        pesoBruto: 15.800,
        medidas: {
          largo: 10.2,
          ancho: 2.5,
          alto: 3.0
        }
      }
    },

    // ===== EMPRESA 4: TRANSPORTES AREQUIPA E.I.R.L. =====
    // Resolución 5 (PRIMIGENIA) - Vehículos de pasajeros
    
    {
      id: '8',
      placa: 'ARE-001',
      empresaActualId: '4',
      resolucionId: '5',
      rutasAsignadasIds: ['8'], // AREQUIPA-MOQUEGUA
      categoria: 'M3',
      marca: 'VOLVO',
      modelo: 'B12R',
      anioFabricacion: 2021,
      estado: 'MANTENIMIENTO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001241-2025',
        fechaEmision: '2025-01-10T09:00:00Z'
      },
      datosTecnicos: {
        motor: 'VOLVO-D12C380',
        chasis: 'YV3R7C1234B789012',
        cilindros: 8,
        ejes: 2,
        ruedas: 6,
        asientos: 38,
        pesoNeto: 9.500,
        pesoBruto: 19.000,
        medidas: {
          largo: 11.2,
          ancho: 2.6,
          alto: 3.4
        }
      }
    },
    {
      id: '9',
      placa: 'ARE-002',
      empresaActualId: '4',
      resolucionId: '5',
      rutasAsignadasIds: ['9'], // AREQUIPA-TACNA
      categoria: 'M2',
      marca: 'MERCEDES-BENZ',
      modelo: 'SPRINTER',
      anioFabricacion: 2022,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001242-2025',
        fechaEmision: '2025-02-15T14:00:00Z'
      },
      datosTecnicos: {
        motor: 'MB-OM651.951',
        chasis: 'WDB9066131L901234',
        cilindros: 4,
        ejes: 2,
        ruedas: 4,
        asientos: 18,
        pesoNeto: 3.400,
        pesoBruto: 6.800,
        medidas: {
          largo: 6.9,
          ancho: 2.0,
          alto: 2.8
        }
      }
    },

    // ===== EMPRESA 5: TRANSPORTES MOQUEGUA S.A.C. =====
    // Resolución 6 (PRIMIGENIA) - Vehículos de carga
    
    {
      id: '10',
      placa: 'MOQ-001',
      empresaActualId: '5',
      resolucionId: '6',
      rutasAsignadasIds: ['10'], // MOQUEGUA-TACNA
      categoria: 'N3',
      marca: 'SCANIA',
      modelo: 'P320',
      anioFabricacion: 2019,
      estado: 'ACTIVO',
      estaActivo: true,
      tuc: {
        nroTuc: 'T-001243-2025',
        fechaEmision: '2025-01-25T10:30:00Z'
      },
      datosTecnicos: {
        motor: 'SCANIA-DC13-320',
        chasis: 'XLE4X2HZ3PZ234567',
        cilindros: 6,
        ejes: 2,
        ruedas: 6,
        asientos: 2,
        pesoNeto: 11.800,
        pesoBruto: 24.500,
        medidas: {
          largo: 12.8,
          ancho: 2.5,
          alto: 3.6
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
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getVehiculos(): Observable<Vehiculo[]> {
    // FORZAR USO DE DATOS MOCK EN DESARROLLO
    console.log('🚀 FORZANDO USO DE DATOS MOCK - NO HACER LLAMADAS HTTP');
    console.log('📊 DATOS MOCK DISPONIBLES:', this.mockVehiculos.length, 'vehículos');
    
    // Mostrar las placas disponibles para debugging
    const placas = this.mockVehiculos.map(v => v.placa);
    console.log('🔢 PLACAS DISPONIBLES:', placas);
    
    // Devolver una copia del array para evitar mutaciones externas
    return of([...this.mockVehiculos]);
    
    /* CÓDIGO HTTP COMENTADO TEMPORALMENTE
    const url = `${this.apiUrl}/vehiculos`;
    
    if (!this.apiUrl) {
      console.log('API URL no configurada, usando datos mock');
      return of(this.mockVehiculos);
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
    */
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
        
        console.log('🚗 Creando vehículo mock:', newVehiculo);
        this.mockVehiculos.push(newVehiculo);
        console.log('📊 Total vehículos mock después de crear:', this.mockVehiculos.length);
        console.log('🔢 Placas disponibles después de crear:', this.mockVehiculos.map(v => v.placa));
        
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

  // Métodos adicionales para funcionalidades específicas
  
  getVehiculosPorEmpresa(empresaId: string): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/empresa/${empresaId}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error obteniendo vehículos por empresa, usando datos mock:', error);
        const vehiculosEmpresa = this.mockVehiculos.filter((v: Vehiculo) => v.empresaActualId === empresaId);
        return of(vehiculosEmpresa);
      })
    );
  }

  getVehiculosPorResolucion(resolucionId: string): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/resolucion/${resolucionId}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error obteniendo vehículos por resolución, usando datos mock:', error);
        const vehiculosResolucion = this.mockVehiculos.filter((v: Vehiculo) => v.resolucionId === resolucionId);
        return of(vehiculosResolucion);
      })
    );
  }

  getVehiculosPorCategoria(categoria: string): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/categoria/${categoria}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error obteniendo vehículos por categoría, usando datos mock:', error);
        const vehiculosCategoria = this.mockVehiculos.filter((v: Vehiculo) => v.categoria === categoria);
        return of(vehiculosCategoria);
      })
    );
  }

  getVehiculosPorEstado(estado: string): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/estado/${estado}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error obteniendo vehículos por estado, usando datos mock:', error);
        const vehiculosEstado = this.mockVehiculos.filter((v: Vehiculo) => v.estado === estado);
        return of(vehiculosEstado);
      })
    );
  }

  // Método para obtener estadísticas del parque vehicular
  getEstadisticasVehiculos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehiculos/estadisticas`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log('Error obteniendo estadísticas, generando desde datos mock:', error);
        // Generar estadísticas desde datos mock
        const vehiculos = this.mockVehiculos || [];
        const estadisticas = {
          totalVehiculos: vehiculos.length,
          vehiculosActivos: vehiculos.filter((v: Vehiculo) => v.estado === 'ACTIVO').length,
          vehiculosMantenimiento: vehiculos.filter((v: Vehiculo) => v.estado === 'MANTENIMIENTO').length,
          vehiculosInactivos: vehiculos.filter((v: Vehiculo) => v.estado === 'INACTIVO').length,
          porCategoria: {
            M2: vehiculos.filter((v: Vehiculo) => v.categoria === 'M2').length,
            M3: vehiculos.filter((v: Vehiculo) => v.categoria === 'M3').length,
            N2: vehiculos.filter((v: Vehiculo) => v.categoria === 'N2').length,
            N3: vehiculos.filter((v: Vehiculo) => v.categoria === 'N3').length
          },
          porEmpresa: vehiculos.reduce((acc: { [key: string]: number }, v: Vehiculo) => {
            acc[v.empresaActualId] = (acc[v.empresaActualId] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number })
        };
        return of(estadisticas);
      })
    );
  }

  // Métodos para carga masiva desde Excel
  
  async descargarPlantillaExcel(): Promise<Blob> {
    try {
      const response = await this.http.get(`${this.apiUrl}/vehiculos/plantilla-excel`, {
        headers: this.getHeaders(),
        responseType: 'blob'
      }).toPromise();
      
      return response as Blob;
    } catch (error) {
      console.log('Error descargando plantilla, generando plantilla mock:', error);
      
      // Generar plantilla mock como CSV para desarrollo
      const csvContent = `Placa,RUC Empresa,Resolución Primigenia,Resolución Hija,Rutas Asignadas,Sede de Registro,Categoría,Marca,Modelo,Año Fabricación,Color,Número Serie,Motor,Chasis,Ejes,Asientos,Peso Neto (kg),Peso Bruto (kg),Largo (m),Ancho (m),Alto (m),Tipo Combustible,Cilindrada,Potencia (HP),Estado,Observaciones
ABC-123,20123456789,R-1001-2024,,"01,02",PUNO,M3,MERCEDES BENZ,O500,2020,BLANCO,MB123456,OM 457 LA,WDB9066131L123456,2,50,8500.0,16000.0,12.0,2.55,3.2,DIESEL,11967.0,354.0,ACTIVO,Vehículo con resolución existente
XYZ-456,20999888777,,,03,AREQUIPA,N3,VOLVO,FH16,2019,AZUL,VL789012,D16G750,VOLVOH16C123456,3,2,12000.0,26000.0,16.0,2.6,3.8,DIESEL,16000.0,750.0,ACTIVO,Empresa será creada automáticamente`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      return blob;
    }
  }

  async validarExcel(archivo: File): Promise<VehiculoValidacion[]> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const response = await this.http.post<any[]>(`${this.apiUrl}/vehiculos/validar-excel`, formData, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.authService.getToken()}`
        })
      }).toPromise();
      
      return response || [];
    } catch (error) {
      console.log('Error validando Excel, simulando validación:', error);
      
      // Simular validación mock
      return [
        {
          fila: 2,
          placa: 'ABC-123',
          valido: true,
          errores: [],
          advertencias: []
        },
        {
          fila: 3,
          placa: 'XYZ-456',
          valido: false,
          errores: ['Ya existe un vehículo con esta placa'],
          advertencias: []
        }
      ];
    }
  }

  async cargaMasivaVehiculos(archivo: File): Promise<CargaMasivaResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const response = await this.http.post<any>(`${this.apiUrl}/vehiculos/carga-masiva`, formData, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.authService.getToken()}`
        })
      }).toPromise();
      
      return response;
    } catch (error) {
      console.log('Error en carga masiva, simulando procesamiento:', error);
      
      // Simular resultado mock
      return {
        total_procesados: 2,
        exitosos: 1,
        errores: 1,
        vehiculos_creados: ['11'],
        errores_detalle: [
          {
            fila: 3,
            placa: 'XYZ-456',
            errores: ['Ya existe un vehículo con esta placa']
          }
        ]
      };
    }
  }

  async getEstadisticasCargaMasiva(): Promise<EstadisticasCargaMasiva> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/vehiculos/carga-masiva/estadisticas`, {
        headers: this.getHeaders()
      }).toPromise();
      
      return response;
    } catch (error) {
      console.log('Error obteniendo estadísticas de carga masiva, usando datos mock:', error);
      
      // Estadísticas mock
      return {
        total_cargas: 5,
        vehiculos_cargados_total: 150,
        ultima_carga: '2024-01-15T10:30:00',
        promedio_exitosos: 85.5,
        errores_comunes: [
          { error: 'Placa duplicada', frecuencia: 15 },
          { error: 'RUC empresa no encontrado', frecuencia: 8 },
          { error: 'Categoría inválida', frecuencia: 5 }
        ]
      };
    }
  }

  // Método para debugging - verificar datos mock
  verificarDatosMock(): void {
    console.log('🔍 VERIFICANDO DATOS MOCK DEL SERVICIO...');
    console.log('📊 TOTAL VEHÍCULOS:', this.mockVehiculos.length);
    
    // Mostrar todas las placas
    const placas = this.mockVehiculos.map(v => v.placa);
    console.log('🔢 PLACAS DISPONIBLES:', placas);
    
    // Mostrar vehículos con placas que empiecen con "PUN"
    const vehiculosPUN = this.mockVehiculos.filter(v => v.placa.startsWith('PUN'));
    console.log('🏔️ VEHÍCULOS PUNO:', vehiculosPUN.length, vehiculosPUN.map(v => v.placa));
    
    // Mostrar vehículos con placas que empiecen con "JUL"
    const vehiculosJUL = this.mockVehiculos.filter(v => v.placa.startsWith('JUL'));
    console.log('🌅 VEHÍCULOS JULIACA:', vehiculosJUL.length, vehiculosJUL.map(v => v.placa));
    
    // Mostrar vehículos con placas que empiecen con "ARE"
    const vehiculosARE = this.mockVehiculos.filter(v => v.placa.startsWith('ARE'));
    console.log('🏙️ VEHÍCULOS AREQUIPA:', vehiculosARE.length, vehiculosARE.map(v => v.placa));
  }
} 