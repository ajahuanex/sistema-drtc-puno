import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  Empresa, 
  EmpresaCreate, 
  EmpresaUpdate, 
  EmpresaFiltros, 
  EmpresaEstadisticas,
  EstadoEmpresa,
  TipoDocumento
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
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-01-15T10:00:00Z'),
      representanteLegal: {
        dni: '12345678',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez Quispe',
        email: 'juan.perez@transportespuno.com',
        telefono: '951234567',
        direccion: 'Av. Principal 123, Puno'
      },
      emailContacto: 'info@transportespuno.com',
      telefonoContacto: '951234567',
      sitioWeb: 'www.transportespuno.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20123456789',
          fechaEmision: new Date('2023-01-15'),
          fechaVencimiento: new Date('2025-01-15'),
          urlDocumento: 'https://example.com/ruc.pdf',
          observaciones: 'RUC activo',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-01-15T10:00:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'Empresa creada con RUC: 20123456789',
          observaciones: 'Creación inicial de empresa'
        }
      ],
      resolucionesPrimigeniasIds: ['1', '2'],
      vehiculosHabilitadosIds: ['1', '2', '3'],
      conductoresHabilitadosIds: ['1', '2'],
      rutasAutorizadasIds: ['1', '2', '3'],
      datosSunat: {
        valido: true,
        razonSocial: 'Transportes Puno S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'Av. Principal 123, Puno',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 25,
      observaciones: 'Empresa en buen estado'
    },
    {
      id: '3',
      ruc: '20345678901',
      razonSocial: {
        principal: 'Transportes Cusco Express S.A.C.',
        sunat: 'Transportes Cusco Express S.A.C.',
        minimo: 'Transportes Cusco Express S.A.C.'
      },
      direccionFiscal: 'Av. Sol 789, Cusco',
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-03-15T09:00:00Z'),
      representanteLegal: {
        dni: '11223344',
        nombres: 'Carlos Alberto',
        apellidos: 'García Mendoza',
        email: 'carlos.garcia@transportescusco.com',
        telefono: '951234568',
        direccion: 'Av. Sol 789, Cusco'
      },
      emailContacto: 'info@transportescusco.com',
      telefonoContacto: '951234568',
      sitioWeb: 'www.transportescusco.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20345678901',
          fechaEmision: new Date('2023-03-15'),
          fechaVencimiento: new Date('2025-03-15'),
          urlDocumento: 'https://example.com/ruc3.pdf',
          observaciones: 'RUC activo',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-03-15T09:00:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'Empresa creada con RUC: 20345678901',
          observaciones: 'Creación inicial de empresa'
        }
      ],
      resolucionesPrimigeniasIds: ['6'],
      vehiculosHabilitadosIds: ['9', '10'],
      conductoresHabilitadosIds: ['3', '4'],
      rutasAutorizadasIds: ['8', '9'],
      datosSunat: {
        valido: true,
        razonSocial: 'Transportes Cusco Express S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'Av. Sol 789, Cusco',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 30,
      observaciones: 'Empresa en buen estado'
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
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-02-20T14:30:00Z'),
      representanteLegal: {
        dni: '87654321',
        nombres: 'María Elena',
        apellidos: 'Rodríguez López',
        email: 'maria.rodriguez@transportesjuliaca.com',
        telefono: '952345678',
        direccion: 'Jr. Comercio 456, Juliaca'
      },
      emailContacto: 'info@transportesjuliaca.com',
      telefonoContacto: '952345678',
      sitioWeb: 'www.transportesjuliaca.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20234567890',
          fechaEmision: new Date('2023-02-20'),
          fechaVencimiento: new Date('2025-02-20'),
          urlDocumento: 'https://example.com/ruc2.pdf',
          observaciones: 'RUC activo',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-02-20T14:30:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'Empresa creada con RUC: 20234567890',
          observaciones: 'Creación inicial de empresa'
        }
      ],
      resolucionesPrimigeniasIds: ['4', '5'],
      vehiculosHabilitadosIds: ['4', '5'],
      conductoresHabilitadosIds: ['3', '4'],
      rutasAutorizadasIds: ['4', '5'],
      datosSunat: {
        valido: true,
        razonSocial: 'Empresa de Transportes Juliaca E.I.R.L.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'Jr. Comercio 456, Juliaca',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 30,
      observaciones: 'Empresa en buen estado'
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
      estado: EstadoEmpresa.EN_TRAMITE,
      estaActivo: true,
      fechaRegistro: new Date('2024-03-10T09:15:00Z'),
      representanteLegal: {
        dni: '11223344',
        nombres: 'Carlos Alberto',
        apellidos: 'Mendoza Torres',
        email: 'carlos.mendoza@transportesinterprovinciales.com',
        telefono: '953456789',
        direccion: 'Av. Tacna 789, Puno'
      },
      emailContacto: 'info@transportesinterprovinciales.com',
      telefonoContacto: '953456789',
      sitioWeb: 'www.transportesinterprovinciales.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20345678901',
          fechaEmision: new Date('2024-03-10'),
          fechaVencimiento: new Date('2026-03-10'),
          urlDocumento: 'https://example.com/ruc3.pdf',
          observaciones: 'RUC en trámite',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-03-10T09:15:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'Empresa creada con RUC: 20345678901',
          observaciones: 'Creación inicial de empresa'
        }
      ],
      resolucionesPrimigeniasIds: [],
      vehiculosHabilitadosIds: [],
      conductoresHabilitadosIds: [],
      rutasAutorizadasIds: [],
      datosSunat: {
        valido: true,
        razonSocial: 'Transportes Interprovinciales del Sur S.A.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'Av. Tacna 789, Puno',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 45,
      observaciones: 'Empresa en trámite de habilitación'
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
      estado: EstadoEmpresa.SUSPENDIDA,
      estaActivo: true,
      fechaRegistro: new Date('2024-01-05T08:00:00Z'),
      representanteLegal: {
        dni: '99887766',
        nombres: 'Ana Patricia',
        apellidos: 'García Mendoza',
        email: 'ana.garcia@transportesaltiplano.com',
        telefono: '954567890',
        direccion: 'Av. La Marina 321, Puno'
      },
      emailContacto: 'info@transportesaltiplano.com',
      telefonoContacto: '954567890',
      sitioWeb: 'www.transportesaltiplano.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20456789012',
          fechaEmision: new Date('2023-01-05'),
          fechaVencimiento: new Date('2025-01-05'),
          urlDocumento: 'https://example.com/ruc4.pdf',
          observaciones: 'RUC suspendido',
          estaActivo: false
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-01-05T08:00:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'Empresa creada con RUC: 20456789012',
          observaciones: 'Creación inicial de empresa'
        },
        {
          fechaCambio: new Date('2024-06-15T10:00:00Z'),
          usuarioId: '2',
          tipoCambio: 'SUSPENSION_EMPRESA',
          campoAnterior: 'HABILITADA',
          campoNuevo: 'SUSPENDIDA',
          observaciones: 'Empresa suspendida por incumplimientos'
        }
      ],
      resolucionesPrimigeniasIds: ['4'],
      vehiculosHabilitadosIds: ['6'],
      conductoresHabilitadosIds: ['5'],
      rutasAutorizadasIds: ['6'],
      datosSunat: {
        valido: true,
        razonSocial: 'Transportes del Altiplano S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'Av. La Marina 321, Puno',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 75,
      observaciones: 'Empresa suspendida por incumplimientos'
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
    // Simular filtros en datos mock
    let empresasFiltradas = [...this.mockEmpresas];

    if (filtros.ruc) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.ruc.toLowerCase().includes(filtros.ruc!.toLowerCase())
      );
    }

    if (filtros.razonSocial) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.razonSocial.principal.toLowerCase().includes(filtros.razonSocial!.toLowerCase())
      );
    }

    if (filtros.estado) {
      empresasFiltradas = empresasFiltradas.filter(emp => emp.estado === filtros.estado);
    }

    if (filtros.fechaDesde) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.fechaRegistro >= filtros.fechaDesde!
      );
    }

    if (filtros.fechaHasta) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.fechaRegistro <= filtros.fechaHasta!
      );
    }

    if (filtros.scoreRiesgoMin !== undefined) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.scoreRiesgo && emp.scoreRiesgo >= filtros.scoreRiesgoMin!
      );
    }

    if (filtros.scoreRiesgoMax !== undefined) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.scoreRiesgo && emp.scoreRiesgo <= filtros.scoreRiesgoMax!
      );
    }

    if (filtros.tieneDocumentosVencidos) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.documentos.some(doc => 
          doc.fechaVencimiento && doc.fechaVencimiento < new Date() && doc.estaActivo
        )
      );
    }

    if (filtros.tieneVehiculos) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.vehiculosHabilitadosIds.length > 0
      );
    }

    if (filtros.tieneConductores) {
      empresasFiltradas = empresasFiltradas.filter(emp => 
        emp.conductoresHabilitadosIds.length > 0
      );
    }

    // Aplicar paginación
    const empresasPaginadas = empresasFiltradas.slice(skip, skip + limit);

    return of(empresasPaginadas).pipe(
      catchError(error => {
        console.error('Error al obtener empresas con filtros:', error);
        return throwError(() => new Error('Error al obtener empresas con filtros'));
      })
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
    return this.http.post<Empresa>(`${this.apiUrl}/empresas`, empresa).pipe(
      catchError(error => {
        console.log('Error creando empresa, simulando creación:', error);
        
        // Simular creación exitosa
        const nuevaEmpresa: Empresa = {
          id: (this.mockEmpresas.length + 1).toString(),
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial,
          direccionFiscal: empresa.direccionFiscal,
          estado: EstadoEmpresa.EN_TRAMITE,
          estaActivo: true,
          fechaRegistro: new Date(),
          representanteLegal: empresa.representanteLegal,
          emailContacto: empresa.emailContacto || '',
          telefonoContacto: empresa.telefonoContacto || '',
          sitioWeb: empresa.sitioWeb || '',
          documentos: empresa.documentos || [],
          auditoria: [
            {
              fechaCambio: new Date(),
              usuarioId: '1',
              tipoCambio: 'CREACION_EMPRESA',
              campoAnterior: undefined,
              campoNuevo: `Empresa creada con RUC: ${empresa.ruc}`,
              observaciones: 'Creación inicial de empresa'
            }
          ],
          resolucionesPrimigeniasIds: [],
          vehiculosHabilitadosIds: [],
          conductoresHabilitadosIds: [],
          rutasAutorizadasIds: [],
          datosSunat: {
            valido: false,
            razonSocial: '',
            estado: '',
            condicion: '',
            direccion: '',
            fechaActualizacion: new Date()
          },
          ultimaValidacionSunat: new Date(),
          scoreRiesgo: 0,
          observaciones: ''
        };
        
        this.mockEmpresas.push(nuevaEmpresa);
        return of(nuevaEmpresa);
      }),
      map(empresa => this.transformEmpresaData(empresa))
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
    return of(this.mockEmpresas).pipe(
      map(empresas => {
        const empresasActivas = empresas.filter(emp => emp.estaActivo);
        
        const empresasConDocumentosVencidos = empresasActivas.filter(emp => 
          emp.documentos.some(doc => 
            doc.fechaVencimiento && doc.fechaVencimiento < new Date() && doc.estaActivo
          )
        ).length;

        const empresasConScoreAltoRiesgo = empresasActivas.filter(emp => 
          emp.scoreRiesgo && emp.scoreRiesgo > 70
        ).length;

        const totalVehiculos = empresasActivas.reduce((total, emp) => 
          total + emp.vehiculosHabilitadosIds.length, 0
        );

        const totalConductores = empresasActivas.reduce((total, emp) => 
          total + emp.conductoresHabilitadosIds.length, 0
        );

        const promedioVehiculosPorEmpresa = empresasActivas.length > 0 
          ? totalVehiculos / empresasActivas.length 
          : 0;

        const promedioConductoresPorEmpresa = empresasActivas.length > 0 
          ? totalConductores / empresasActivas.length 
          : 0;

        const estadisticas: EmpresaEstadisticas = {
          totalEmpresas: empresasActivas.length,
          empresasHabilitadas: empresasActivas.filter(emp => emp.estado === EstadoEmpresa.HABILITADA).length,
          empresasEnTramite: empresasActivas.filter(emp => emp.estado === EstadoEmpresa.EN_TRAMITE).length,
          empresasSuspendidas: empresasActivas.filter(emp => emp.estado === EstadoEmpresa.SUSPENDIDA).length,
          empresasCanceladas: empresasActivas.filter(emp => emp.estado === EstadoEmpresa.CANCELADA).length,
          empresasDadasDeBaja: empresasActivas.filter(emp => emp.estado === EstadoEmpresa.DADA_DE_BAJA).length,
          empresasConDocumentosVencidos: empresasConDocumentosVencidos,
          empresasConScoreAltoRiesgo: empresasConScoreAltoRiesgo,
          promedioVehiculosPorEmpresa: promedioVehiculosPorEmpresa,
          promedioConductoresPorEmpresa: promedioConductoresPorEmpresa
        };
        
        return estadisticas;
      }),
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return throwError(() => new Error('Error al obtener estadísticas'));
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
    return {
      id: empresa.id || empresa._id || '',
      ruc: empresa.ruc || '',
      razonSocial: empresa.razonSocial || empresa.razon_social || {
        principal: '',
        sunat: '',
        minimo: ''
      },
      direccionFiscal: empresa.direccionFiscal || empresa.direccion_fiscal || '',
      estado: empresa.estado || EstadoEmpresa.EN_TRAMITE,
      estaActivo: empresa.estaActivo !== undefined ? empresa.estaActivo : (empresa.esta_activo !== undefined ? empresa.esta_activo : true),
      fechaRegistro: empresa.fechaRegistro || empresa.fecha_registro || new Date(),
      representanteLegal: empresa.representanteLegal || empresa.representante_legal || {
        dni: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        direccion: ''
      },
      emailContacto: empresa.emailContacto || empresa.email_contacto || '',
      telefonoContacto: empresa.telefonoContacto || empresa.telefono_contacto || '',
      sitioWeb: empresa.sitioWeb || empresa.sitio_web || '',
      documentos: empresa.documentos || [],
      auditoria: empresa.auditoria || [],
      resolucionesPrimigeniasIds: empresa.resolucionesPrimigeniasIds || empresa.resoluciones_primigenias_ids || [],
      vehiculosHabilitadosIds: empresa.vehiculosHabilitadosIds || empresa.vehiculos_habilitados_ids || [],
      conductoresHabilitadosIds: empresa.conductoresHabilitadosIds || empresa.conductores_habilitados_ids || [],
      rutasAutorizadasIds: empresa.rutasAutorizadasIds || empresa.rutas_autorizadas_ids || [],
      datosSunat: empresa.datosSunat || empresa.datos_sunat || {
        valido: false,
        razonSocial: '',
        estado: '',
        condicion: '',
        direccion: '',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: empresa.ultimaValidacionSunat || empresa.ultima_validacion_sunat || new Date(),
      scoreRiesgo: empresa.scoreRiesgo || empresa.score_riesgo || 0,
      observaciones: empresa.observaciones || ''
    };
  }
} 