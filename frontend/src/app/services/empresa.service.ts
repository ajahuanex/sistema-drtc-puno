import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  Empresa, 
  EmpresaCreate, 
  EmpresaUpdate, 
  EmpresaDetalle, 
  EmpresaFiltros, 
  EmpresaEstadisticas 
} from '../models/empresa.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Datos mock para desarrollo
  private mockEmpresas: Empresa[] = [
    {
      id: '1',
      ruc: '20123456789',
      razonSocial: {
        principal: 'Transportes Puno S.A.C.',
        sunat: 'Transportes Puno S.A.C.',
        minimo: 'Transportes Puno S.A.C.'
      },
      direccionFiscal: 'Av. Principal 123, Puno',
      estado: 'HABILITADA',
      estaActivo: true,
      fechaRegistro: '2024-01-15T10:00:00Z',
      representanteLegal: {
        dni: '12345678',
        nombres: 'Juan Carlos Pérez Quispe'
      },
      resolucionesPrimigeniasIds: ['1', '2'],
      vehiculosHabilitadosIds: ['1', '2', '3'],
      conductoresHabilitadosIds: ['1', '2'],
      rutasAutorizadasIds: ['1', '2', '3']
    },
    {
      id: '2',
      ruc: '20234567890',
      razonSocial: {
        principal: 'Empresa de Transportes Juliaca E.I.R.L.',
        sunat: 'Empresa de Transportes Juliaca E.I.R.L.',
        minimo: 'Empresa de Transportes Juliaca E.I.R.L.'
      },
      direccionFiscal: 'Jr. Comercio 456, Juliaca',
      estado: 'HABILITADA',
      estaActivo: true,
      fechaRegistro: '2024-02-20T14:30:00Z',
      representanteLegal: {
        dni: '87654321',
        nombres: 'María Elena Rodríguez López'
      },
      resolucionesPrimigeniasIds: ['3'],
      vehiculosHabilitadosIds: ['4', '5'],
      conductoresHabilitadosIds: ['3', '4'],
      rutasAutorizadasIds: ['4', '5']
    },
    {
      id: '3',
      ruc: '20345678901',
      razonSocial: {
        principal: 'Transportes Interprovinciales del Sur S.A.',
        sunat: 'Transportes Interprovinciales del Sur S.A.',
        minimo: 'Transportes Interprovinciales del Sur S.A.'
      },
      direccionFiscal: 'Av. Tacna 789, Puno',
      estado: 'EN_TRAMITE',
      estaActivo: true,
      fechaRegistro: '2024-03-10T09:15:00Z',
      representanteLegal: {
        dni: '11223344',
        nombres: 'Carlos Alberto Mendoza Torres'
      },
      resolucionesPrimigeniasIds: [],
      vehiculosHabilitadosIds: [],
      conductoresHabilitadosIds: [],
      rutasAutorizadasIds: []
    },
    {
      id: '4',
      ruc: '20456789012',
      razonSocial: {
        principal: 'Transportes del Altiplano S.A.C.',
        sunat: 'Transportes del Altiplano S.A.C.',
        minimo: 'Transportes del Altiplano S.A.C.'
      },
      direccionFiscal: 'Av. La Marina 321, Puno',
      estado: 'SUSPENDIDA',
      estaActivo: true,
      fechaRegistro: '2024-01-05T08:00:00Z',
      representanteLegal: {
        dni: '99887766',
        nombres: 'Ana Patricia Flores Huanca'
      },
      resolucionesPrimigeniasIds: ['4'],
      vehiculosHabilitadosIds: ['6', '7'],
      conductoresHabilitadosIds: ['5', '6'],
      rutasAutorizadasIds: ['6', '7']
    }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  private getHeaders(): HttpHeaders {
    const authHeaders = this.authService.getAuthHeaders();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...authHeaders
    });
    return headers;
  }

  // Métodos CRUD básicos
  getEmpresas(skip: number = 0, limit: number = 100, estado?: string): Observable<Empresa[]> {
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo al login...');
      this.router.navigate(['/login']);
      return of([]);
    }

    let url = `${this.apiUrl}/empresas/?skip=${skip}&limit=${limit}`;
    if (estado) {
      url += `&estado=${estado}`;
    }
    
    console.log('Solicitando empresas desde:', url);
    
    return this.http.get<Empresa[]>(url).pipe(
      catchError(error => {
        console.log('Error conectando al backend:', error);
        
        if (error.status === 401) {
          console.log('Error 401 - Usuario no autorizado, redirigiendo al login...');
          this.authService.logout();
          this.router.navigate(['/login']);
          return of([]);
        }
        
        console.log('Usando datos mock debido al error:', error.status);
        return of(this.mockEmpresas);
      }),
      map(empresas => {
        console.log('Datos originales:', empresas);
        const transformed = empresas
          .map(empresa => this.transformEmpresaData(empresa))
          .filter(empresa => empresa !== null);
        console.log('Datos transformados:', transformed);
        return transformed;
      })
    );
  }

  // Método para obtener empresas con filtros avanzados
  getEmpresasConFiltros(filtros: EmpresaFiltros, skip: number = 0, limit: number = 100): Observable<Empresa[]> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return of([]);
    }

    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.ruc) params = params.set('ruc', filtros.ruc);
    if (filtros.razonSocial) params = params.set('razon_social', filtros.razonSocial);
    if (filtros.fechaDesde) params = params.set('fecha_desde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fecha_hasta', filtros.fechaHasta);

    return this.http.get<Empresa[]>(`${this.apiUrl}/empresas/filtros`, { params }).pipe(
      catchError(error => {
        console.log('Error obteniendo empresas con filtros, usando datos mock:', error);
        // Aplicar filtros a datos mock
        let empresasFiltradas = this.mockEmpresas;
        
        if (filtros.estado) {
          empresasFiltradas = empresasFiltradas.filter(emp => emp.estado === filtros.estado);
        }
        if (filtros.ruc) {
          empresasFiltradas = empresasFiltradas.filter(emp => emp.ruc.includes(filtros.ruc!));
        }
        if (filtros.razonSocial) {
          empresasFiltradas = empresasFiltradas.filter(emp => 
            emp.razonSocial.principal.toLowerCase().includes(filtros.razonSocial!.toLowerCase())
          );
        }
        
        return of(empresasFiltradas);
      }),
      map(empresas => empresas.map(empresa => this.transformEmpresaData(empresa)))
    );
  }

  getEmpresaById(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/empresas/${id}`).pipe(
      catchError(error => {
        console.log('Error obteniendo empresa por ID, usando datos mock:', error);
        const mockEmpresa = this.mockEmpresas.find(emp => emp.id === id);
        if (mockEmpresa) {
          return of(mockEmpresa);
        } else {
          throw new Error('Empresa no encontrada');
        }
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  getEmpresaByRuc(ruc: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/empresas/ruc/${ruc}`).pipe(
      catchError(error => {
        console.log('Error obteniendo empresa por RUC, usando datos mock:', error);
        const mockEmpresa = this.mockEmpresas.find(emp => emp.ruc === ruc);
        if (mockEmpresa) {
          return of(mockEmpresa);
        } else {
          throw new Error('Empresa no encontrada');
        }
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  createEmpresa(empresa: EmpresaCreate): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/`, empresa).pipe(
      catchError(error => {
        console.log('Error creando empresa, simulando creación con datos mock:', error);
        const newEmpresa: Empresa = {
          id: (this.mockEmpresas.length + 1).toString(),
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial,
          direccionFiscal: empresa.direccionFiscal,
          estado: 'EN_TRAMITE',
          estaActivo: true,
          fechaRegistro: new Date().toISOString(),
          representanteLegal: empresa.representanteLegal,
          resolucionesPrimigeniasIds: [],
          vehiculosHabilitadosIds: [],
          conductoresHabilitadosIds: [],
          rutasAutorizadasIds: []
        };
        
        this.mockEmpresas.push(newEmpresa);
        return of(newEmpresa);
      })
    );
  }

  updateEmpresa(id: string, empresa: EmpresaUpdate): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/empresas/${id}`, empresa).pipe(
      catchError(error => {
        console.log('Error actualizando empresa, simulando actualización con datos mock:', error);
        const mockEmpresa = this.mockEmpresas.find(emp => emp.id === id);
        if (mockEmpresa) {
          Object.assign(mockEmpresa, empresa);
          return of(mockEmpresa);
        } else {
          throw new Error('Empresa no encontrada');
        }
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  deleteEmpresa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/empresas/${id}`).pipe(
      catchError(error => {
        console.log('Error eliminando empresa, simulando eliminación con datos mock:', error);
        const index = this.mockEmpresas.findIndex(emp => emp.id === id);
        if (index !== -1) {
          this.mockEmpresas[index].estaActivo = false;
        }
        return of(void 0);
      })
    );
  }

  // Métodos para estadísticas
  getEstadisticasEmpresas(): Observable<EmpresaEstadisticas> {
    return this.http.get<EmpresaEstadisticas>(`${this.apiUrl}/empresas/estadisticas`).pipe(
      catchError(error => {
        console.log('Error obteniendo estadísticas, calculando desde datos mock:', error);
        const empresasActivas = this.mockEmpresas.filter(emp => emp.estaActivo);
        
        const estadisticas: EmpresaEstadisticas = {
          totalEmpresas: empresasActivas.length,
          empresasHabilitadas: empresasActivas.filter(emp => emp.estado === 'HABILITADA').length,
          empresasEnTramite: empresasActivas.filter(emp => emp.estado === 'EN_TRAMITE').length,
          empresasSuspendidas: empresasActivas.filter(emp => emp.estado === 'SUSPENDIDA').length,
          empresasCanceladas: empresasActivas.filter(emp => emp.estado === 'CANCELADA').length
        };
        
        return of(estadisticas);
      })
    );
  }

  // Métodos para gestión de vehículos y conductores
  agregarVehiculoAEmpresa(empresaId: string, vehiculoId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`, {}).pipe(
      catchError(error => {
        console.log('Error agregando vehículo a empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa && !empresa.vehiculosHabilitadosIds.includes(vehiculoId)) {
          empresa.vehiculosHabilitadosIds.push(vehiculoId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  removerVehiculoDeEmpresa(empresaId: string, vehiculoId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`).pipe(
      catchError(error => {
        console.log('Error removiendo vehículo de empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa) {
          empresa.vehiculosHabilitadosIds = empresa.vehiculosHabilitadosIds.filter(id => id !== vehiculoId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  agregarConductorAEmpresa(empresaId: string, conductorId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`, {}).pipe(
      catchError(error => {
        console.log('Error agregando conductor a empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa && !empresa.conductoresHabilitadosIds.includes(conductorId)) {
          empresa.conductoresHabilitadosIds.push(conductorId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  removerConductorDeEmpresa(empresaId: string, conductorId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`).pipe(
      catchError(error => {
        console.log('Error removiendo conductor de empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa) {
          empresa.conductoresHabilitadosIds = empresa.conductoresHabilitadosIds.filter(id => id !== conductorId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  // Métodos para gestión de rutas
  agregarRutaAEmpresa(empresaId: string, rutaId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`, {}).pipe(
      catchError(error => {
        console.log('Error agregando ruta a empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa && !empresa.rutasAutorizadasIds.includes(rutaId)) {
          empresa.rutasAutorizadasIds.push(rutaId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  removerRutaDeEmpresa(empresaId: string, rutaId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`).pipe(
      catchError(error => {
        console.log('Error removiendo ruta de empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa) {
          empresa.rutasAutorizadasIds = empresa.rutasAutorizadasIds.filter(id => id !== rutaId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  // Métodos para gestión de resoluciones
  agregarResolucionAEmpresa(empresaId: string, resolucionId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`, {}).pipe(
      catchError(error => {
        console.log('Error agregando resolución a empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa && !empresa.resolucionesPrimigeniasIds.includes(resolucionId)) {
          empresa.resolucionesPrimigeniasIds.push(resolucionId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  removerResolucionDeEmpresa(empresaId: string, resolucionId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`).pipe(
      catchError(error => {
        console.log('Error removiendo resolución de empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        if (empresa) {
          empresa.resolucionesPrimigeniasIds = empresa.resolucionesPrimigeniasIds.filter(id => id !== resolucionId);
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  getResolucionesEmpresa(empresaId: string): Observable<{ empresa_id: string; resoluciones: string[]; total: number }> {
    return this.http.get<{ empresa_id: string; resoluciones: string[]; total: number }>(`${this.apiUrl}/empresas/${empresaId}/resoluciones`).pipe(
      catchError(error => {
        console.log('Error obteniendo resoluciones de empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === empresaId);
        return of({
          empresa_id: empresaId,
          resoluciones: empresa?.resolucionesPrimigeniasIds || [],
          total: empresa?.resolucionesPrimigeniasIds.length || 0
        });
      })
    );
  }

  // Métodos para validación
  validarRuc(ruc: string): Observable<{ valido: boolean; empresa?: Empresa }> {
    return this.http.get<{ valido: boolean; empresa?: Empresa }>(`${this.apiUrl}/empresas/validar-ruc/${ruc}`).pipe(
      catchError(error => {
        console.log('Error validando RUC, simulando validación con datos mock:', error);
        const empresaExistente = this.mockEmpresas.find(emp => emp.ruc === ruc);
        return of({
          valido: !empresaExistente,
          empresa: empresaExistente
        });
      })
    );
  }

  // Métodos para exportación
  exportarEmpresas(formato: 'pdf' | 'excel' | 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/empresas/exportar/${formato}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.log('Error exportando empresas:', error);
        throw new Error('Error al exportar empresas');
      })
    );
  }

  // Métodos para datos mock
  getMockInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mock/info`, { headers: this.getHeaders() });
  }

  getMockEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.apiUrl}/mock/empresas`, { headers: this.getHeaders() });
  }

  getMockCredentials(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mock/credenciales`);
  }

  private transformEmpresaData(empresa: any): Empresa {
    console.log('Transformando empresa:', empresa);
    
    if (!empresa) {
      console.error('Empresa es null o undefined');
      return null as any;
    }
    
    const transformed = {
      id: empresa.id || '',
      ruc: empresa.ruc || '',
      razonSocial: {
        principal: empresa.razonSocial?.principal || empresa.razon_social?.principal || 'Sin razón social',
        sunat: empresa.razonSocial?.sunat || empresa.razon_social?.sunat || '',
        minimo: empresa.razonSocial?.minimo || empresa.razon_social?.minimo || ''
      },
      direccionFiscal: empresa.direccionFiscal || empresa.direccion_fiscal || '',
      estado: empresa.estado || 'EN_TRAMITE',
      estaActivo: empresa.estaActivo !== undefined ? empresa.estaActivo : (empresa.esta_activo !== undefined ? empresa.esta_activo : true),
      fechaRegistro: empresa.fechaRegistro || empresa.fecha_registro || new Date().toISOString(),
      representanteLegal: {
        dni: empresa.representanteLegal?.dni || empresa.representante_legal?.dni || '',
        nombres: empresa.representanteLegal?.nombres || empresa.representante_legal?.nombres || 'Sin representante'
      },
      resolucionesPrimigeniasIds: empresa.resolucionesPrimigeniasIds || empresa.resoluciones_primigenias_ids || [],
      vehiculosHabilitadosIds: empresa.vehiculosHabilitadosIds || empresa.vehiculos_habilitados_ids || [],
      conductoresHabilitadosIds: empresa.conductoresHabilitadosIds || empresa.conductores_habilitados_ids || [],
      rutasAutorizadasIds: empresa.rutasAutorizadasIds || empresa.rutas_autorizadas_ids || []
    };
    
    console.log('Empresa transformada:', transformed);
    return transformed;
  }
} 