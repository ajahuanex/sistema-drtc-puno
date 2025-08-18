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
        principal: 'TRANSPORTES PUNO S.A.C.',
        sunat: 'TRANSPORTES PUNO S.A.C.',
        minimo: 'TRANSPORTES PUNO S.A.C.'
      },
      direccionFiscal: 'AV. PRINCIPAL 123, PUNO',
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-01-15T10:00:00Z'),
      representanteLegal: {
        dni: '12345678',
        nombres: 'JUAN CARLOS',
        apellidos: 'PÉREZ QUISPE',
        email: 'juan.perez@transportespuno.com',
        telefono: '951234567',
        direccion: 'AV. PRINCIPAL 123, PUNO'
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
          observaciones: 'RUC ACTIVO',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-01-15T10:00:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'EMPRESA CREADA CON RUC: 20123456789',
          observaciones: 'CREACIÓN INICIAL DE EMPRESA'
        }
      ],
      resolucionesPrimigeniasIds: ['1', '2'],
      vehiculosHabilitadosIds: ['1', '2', '3'],
      conductoresHabilitadosIds: ['1', '2'],
      rutasAutorizadasIds: ['1', '2', '3'],
      datosSunat: {
        valido: true,
        razonSocial: 'TRANSPORTES PUNO S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'AV. PRINCIPAL 123, PUNO',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 25,
      observaciones: 'EMPRESA EN BUEN ESTADO'
    },
    {
      id: '2',
      ruc: '20234567890',
      razonSocial: {
        principal: 'EMPRESA DE TRANSPORTES JULIACA E.I.R.L.',
        sunat: 'EMPRESA DE TRANSPORTES JULIACA E.I.R.L.',
        minimo: 'EMPRESA DE TRANSPORTES JULIACA E.I.R.L.'
      },
      direccionFiscal: 'JR. COMERCIO 456, JULIACA',
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-02-20T14:30:00Z'),
      representanteLegal: {
        dni: '87654321',
        nombres: 'MARÍA ELENA',
        apellidos: 'RODRÍGUEZ LÓPEZ',
        email: 'maria.rodriguez@transportesjuliaca.com',
        telefono: '952345678',
        direccion: 'JR. COMERCIO 456, JULIACA'
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
          observaciones: 'RUC ACTIVO',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-02-20T14:30:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'EMPRESA CREADA CON RUC: 20234567890',
          observaciones: 'CREACIÓN INICIAL DE EMPRESA'
        }
      ],
      resolucionesPrimigeniasIds: ['4', '5'],
      vehiculosHabilitadosIds: ['4', '5'],
      conductoresHabilitadosIds: ['3', '4'],
      rutasAutorizadasIds: ['4', '5'],
      datosSunat: {
        valido: true,
        razonSocial: 'EMPRESA DE TRANSPORTES JULIACA E.I.R.L.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'JR. COMERCIO 456, JULIACA',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 30,
      observaciones: 'EMPRESA EN BUEN ESTADO'
    },
    {
      id: '3',
      ruc: '20345678901',
      razonSocial: {
        principal: 'TRANSPORTES CUSCO EXPRESS S.A.C.',
        sunat: 'TRANSPORTES CUSCO EXPRESS S.A.C.',
        minimo: 'TRANSPORTES CUSCO EXPRESS S.A.C.'
      },
      direccionFiscal: 'AV. SOL 789, CUSCO',
      estado: EstadoEmpresa.EN_TRAMITE,
      estaActivo: true,
      fechaRegistro: new Date('2024-03-15T09:00:00Z'),
      representanteLegal: {
        dni: '11223344',
        nombres: 'CARLOS ALBERTO',
        apellidos: 'GARCÍA MENDOZA',
        email: 'carlos.garcia@transportescusco.com',
        telefono: '951234568',
        direccion: 'AV. SOL 789, CUSCO'
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
          observaciones: 'RUC ACTIVO',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-03-15T09:00:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'EMPRESA CREADA CON RUC: 20345678901',
          observaciones: 'CREACIÓN INICIAL DE EMPRESA'
        }
      ],
      resolucionesPrimigeniasIds: ['6'],
      vehiculosHabilitadosIds: ['9', '10'],
      conductoresHabilitadosIds: ['3', '4'],
      rutasAutorizadasIds: ['8', '9'],
      datosSunat: {
        valido: true,
        razonSocial: 'TRANSPORTES CUSCO EXPRESS S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'AV. SOL 789, CUSCO',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 30,
      observaciones: 'EMPRESA EN BUEN ESTADO'
    },
    {
      id: '3',
      ruc: '20345678901',
      razonSocial: {
        principal: 'TRANSPORTES INTERPROVINCIALES S.A.C.',
        sunat: 'TRANSPORTES INTERPROVINCIALES S.A.C.',
        minimo: 'TRANSPORTES INTERPROVINCIALES S.A.C.'
      },
      direccionFiscal: 'AV. TACNA 789, PUNO',
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-03-15T09:15:00Z'),
      representanteLegal: {
        dni: '11223344',
        nombres: 'CARLOS ALBERTO',
        apellidos: 'GARCÍA SILVA',
        email: 'carlos.garcia@transportesinter.com',
        telefono: '952345678',
        direccion: 'AV. TACNA 789, PUNO'
      },
      emailContacto: 'info@transportesinter.com',
      telefonoContacto: '952345678',
      sitioWeb: 'www.transportesinter.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20345678901',
          fechaEmision: new Date('2023-03-15'),
          fechaVencimiento: new Date('2025-03-15'),
          urlDocumento: 'https://example.com/ruc3.pdf',
          observaciones: 'RUC ACTIVO',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-03-15T09:15:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'EMPRESA CREADA CON RUC: 20345678901',
          observaciones: 'CREACIÓN INICIAL DE EMPRESA'
        }
      ],
      resolucionesPrimigeniasIds: ['3'],
      vehiculosHabilitadosIds: ['4', '5'],
      conductoresHabilitadosIds: ['3', '4'],
      rutasAutorizadasIds: ['3', '4'],
      datosSunat: {
        valido: true,
        razonSocial: 'TRANSPORTES INTERPROVINCIALES S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'AV. TACNA 789, PUNO',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 35,
      observaciones: 'EMPRESA EN BUEN ESTADO'
    },
    {
      id: '4',
      ruc: '20456789012',
      razonSocial: {
        principal: 'TRANSPORTES URBANOS PUNO S.A.C.',
        sunat: 'TRANSPORTES URBANOS PUNO S.A.C.',
        minimo: 'TRANSPORTES URBANOS PUNO S.A.C.'
      },
      direccionFiscal: 'JR. LIMA 321, PUNO',
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-04-10T11:45:00Z'),
      representanteLegal: {
        dni: '22334455',
        nombres: 'ANA MARÍA',
        apellidos: 'TORRES VARGAS',
        email: 'ana.torres@transportesurbanos.com',
        telefono: '953456789',
        direccion: 'JR. LIMA 321, PUNO'
      },
      emailContacto: 'info@transportesurbanos.com',
      telefonoContacto: '953456789',
      sitioWeb: 'www.transportesurbanos.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20456789012',
          fechaEmision: new Date('2023-04-10'),
          fechaVencimiento: new Date('2025-04-10'),
          urlDocumento: 'https://example.com/ruc4.pdf',
          observaciones: 'RUC ACTIVO',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-04-10T11:45:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'EMPRESA CREADA CON RUC: 20456789012',
          observaciones: 'CREACIÓN INICIAL DE EMPRESA'
        }
      ],
      resolucionesPrimigeniasIds: ['4'],
      vehiculosHabilitadosIds: ['6', '7'],
      conductoresHabilitadosIds: ['5', '6'],
      rutasAutorizadasIds: ['5', '6'],
      datosSunat: {
        valido: true,
        razonSocial: 'TRANSPORTES URBANOS PUNO S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'JR. LIMA 321, PUNO',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 28,
      observaciones: 'EMPRESA EN BUEN ESTADO'
    },
    {
      id: '5',
      ruc: '20567890123',
      razonSocial: {
        principal: 'TRANSPORTES RURALES S.A.C.',
        sunat: 'TRANSPORTES RURALES S.A.C.',
        minimo: 'TRANSPORTES RURALES S.A.C.'
      },
      direccionFiscal: 'AV. AYACUCHO 654, PUNO',
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-05-05T16:20:00Z'),
      representanteLegal: {
        dni: '33445566',
        nombres: 'ROBERTO JOSÉ',
        apellidos: 'MARTÍNEZ QUISPE',
        email: 'roberto.martinez@transportesrurales.com',
        telefono: '954567890',
        direccion: 'AV. AYACUCHO 654, PUNO'
      },
      emailContacto: 'info@transportesrurales.com',
      telefonoContacto: '954567890',
      sitioWeb: 'www.transportesrurales.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20567890123',
          fechaEmision: new Date('2023-05-05'),
          fechaVencimiento: new Date('2025-05-05'),
          urlDocumento: 'https://example.com/ruc5.pdf',
          observaciones: 'RUC ACTIVO',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-05-05T16:20:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'EMPRESA CREADA CON RUC: 20567890123',
          observaciones: 'CREACIÓN INICIAL DE EMPRESA'
        }
      ],
      resolucionesPrimigeniasIds: ['5'],
      vehiculosHabilitadosIds: ['8', '9'],
      conductoresHabilitadosIds: ['7', '8'],
      rutasAutorizadasIds: ['7', '8'],
      datosSunat: {
        valido: true,
        razonSocial: 'TRANSPORTES RURALES S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'AV. AYACUCHO 654, PUNO',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 32,
      observaciones: 'EMPRESA EN BUEN ESTADO'
    },
    {
      id: '6',
      ruc: '20678901234',
      razonSocial: {
        principal: 'TRANSPORTES EXPRESS PUNO S.A.C.',
        sunat: 'TRANSPORTES EXPRESS PUNO S.A.C.',
        minimo: 'TRANSPORTES EXPRESS PUNO S.A.C.'
      },
      direccionFiscal: 'JR. AREQUIPA 987, PUNO',
      estado: EstadoEmpresa.HABILITADA,
      estaActivo: true,
      fechaRegistro: new Date('2024-06-01T13:30:00Z'),
      representanteLegal: {
        dni: '44556677',
        nombres: 'LUCÍA FERNANDA',
        apellidos: 'HERRERA MAMANI',
        email: 'lucia.herrera@transportesexpress.com',
        telefono: '955678901',
        direccion: 'JR. AREQUIPA 987, PUNO'
      },
      emailContacto: 'info@transportesexpress.com',
      telefonoContacto: '955678901',
      sitioWeb: 'www.transportesexpress.com',
      documentos: [
        {
          tipo: TipoDocumento.RUC,
          numero: '20678901234',
          fechaEmision: new Date('2023-06-01'),
          fechaVencimiento: new Date('2025-06-01'),
          urlDocumento: 'https://example.com/ruc6.pdf',
          observaciones: 'RUC ACTIVO',
          estaActivo: true
        }
      ],
      auditoria: [
        {
          fechaCambio: new Date('2024-06-01T13:30:00Z'),
          usuarioId: '1',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'EMPRESA CREADA CON RUC: 20678901234',
          observaciones: 'CREACIÓN INICIAL DE EMPRESA'
        }
      ],
      resolucionesPrimigeniasIds: ['9', '10'],
      vehiculosHabilitadosIds: ['10', '11'],
      conductoresHabilitadosIds: ['9', '10'],
      rutasAutorizadasIds: ['9', '10'],
      datosSunat: {
        valido: true,
        razonSocial: 'TRANSPORTES EXPRESS PUNO S.A.C.',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'JR. AREQUIPA 987, PUNO',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: new Date(),
      scoreRiesgo: 27,
      observaciones: 'EMPRESA EN BUEN ESTADO'
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

  // Métodos principales CRUD
  getEmpresas(skip: number = 0, limit: number = 100): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.apiUrl}/empresas?skip=${skip}&limit=${limit}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.log('Error obteniendo empresas, usando datos mock:', error);
        return of(this.mockEmpresas.slice(skip, skip + limit));
      }),
      map(empresas => empresas.map(empresa => this.transformEmpresaData(empresa)))
    );
  }

  getEmpresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/empresas/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.log('Error obteniendo empresa, usando datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === id);
        if (!empresa) {
          throw new Error('Empresa no encontrada');
        }
        return of(empresa);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  createEmpresa(empresaData: EmpresaCreate): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas`, empresaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.log('Error creando empresa, simulando con datos mock:', error);
        const nuevaEmpresa: Empresa = {
          id: (this.mockEmpresas.length + 1).toString(),
          ruc: empresaData.ruc,
          razonSocial: empresaData.razonSocial,
          direccionFiscal: empresaData.direccionFiscal,
          estado: EstadoEmpresa.EN_TRAMITE,
          estaActivo: true,
          fechaRegistro: new Date(),
          representanteLegal: empresaData.representanteLegal,
          emailContacto: empresaData.emailContacto,
          telefonoContacto: empresaData.telefonoContacto,
          sitioWeb: empresaData.sitioWeb,
          documentos: [],
          auditoria: [{
            fechaCambio: new Date(),
            usuarioId: this.authService.getCurrentUser()?.id || '1',
            tipoCambio: 'CREACION_EMPRESA',
            campoAnterior: undefined,
            campoNuevo: `EMPRESA CREADA CON RUC: ${empresaData.ruc}`,
            observaciones: 'CREACIÓN INICIAL DE EMPRESA'
          }],
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
          observaciones: 'EMPRESA NUEVA EN TRÁMITE'
        };
        this.mockEmpresas.push(nuevaEmpresa);
        return of(nuevaEmpresa);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  updateEmpresa(id: string, empresaData: EmpresaUpdate): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/empresas/${id}`, empresaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.log('Error actualizando empresa, simulando con datos mock:', error);
        const empresa = this.mockEmpresas.find(emp => emp.id === id);
        if (empresa) {
          Object.assign(empresa, empresaData);
          empresa.auditoria.push({
            fechaCambio: new Date(),
            usuarioId: this.authService.getCurrentUser()?.id || '1',
            tipoCambio: 'ACTUALIZACION_EMPRESA',
            campoAnterior: undefined,
            campoNuevo: 'EMPRESA ACTUALIZADA',
            observaciones: 'ACTUALIZACIÓN DE DATOS DE EMPRESA'
          });
        }
        return of(empresa || this.mockEmpresas[0]);
      }),
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  deleteEmpresa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/empresas/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.log('Error eliminando empresa, simulando con datos mock:', error);
        const index = this.mockEmpresas.findIndex(emp => emp.id === id);
        if (index !== -1) {
          this.mockEmpresas.splice(index, 1);
        }
        return of(void 0);
      })
    );
  }

  // Métodos de filtrado y búsqueda
  getEmpresasConFiltros(filtros: EmpresaFiltros): Observable<Empresa[]> {
    const params = new HttpParams()
      .set('skip', '0')
      .set('limit', '1000');

    if (filtros.ruc) params.set('ruc', filtros.ruc);
    if (filtros.razonSocial) params.set('razon_social', filtros.razonSocial);
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.fechaDesde) params.set('fecha_desde', filtros.fechaDesde.toISOString());
    if (filtros.fechaHasta) params.set('fecha_hasta', filtros.fechaHasta.toISOString());

    return this.http.get<Empresa[]>(`${this.apiUrl}/empresas/filtros`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.log('Error aplicando filtros, usando datos mock:', error);
        let empresasFiltradas = [...this.mockEmpresas];
        
        if (filtros.ruc) {
          empresasFiltradas = empresasFiltradas.filter(emp => 
            emp.ruc.includes(filtros.ruc!)
          );
        }
        
        if (filtros.razonSocial) {
          empresasFiltradas = empresasFiltradas.filter(emp => 
            emp.razonSocial.principal.toLowerCase().includes(filtros.razonSocial!.toLowerCase())
          );
        }
        
        if (filtros.estado) {
          empresasFiltradas = empresasFiltradas.filter(emp => 
            emp.estado === filtros.estado
          );
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
        
        return of(empresasFiltradas);
      }),
      map(empresas => empresas.map(empresa => this.transformEmpresaData(empresa)))
    );
  }

  // Métodos de estadísticas
  getEstadisticasEmpresas(): Observable<EmpresaEstadisticas> {
    return this.http.get<EmpresaEstadisticas>(`${this.apiUrl}/empresas/estadisticas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.log('Error obteniendo estadísticas, calculando con datos mock:', error);
        const totalEmpresas = this.mockEmpresas.length;
        const empresasHabilitadas = this.mockEmpresas.filter(emp => emp.estado === EstadoEmpresa.HABILITADA).length;
        const empresasEnTramite = this.mockEmpresas.filter(emp => emp.estado === EstadoEmpresa.EN_TRAMITE).length;
        const empresasSuspendidas = this.mockEmpresas.filter(emp => emp.estado === EstadoEmpresa.SUSPENDIDA).length;
        const empresasCanceladas = this.mockEmpresas.filter(emp => emp.estado === EstadoEmpresa.CANCELADA).length;
        const empresasDadasDeBaja = this.mockEmpresas.filter(emp => emp.estado === EstadoEmpresa.DADA_DE_BAJA).length;
        
        // Calcular estadísticas adicionales
        const empresasConDocumentosVencidos = this.mockEmpresas.filter(emp => 
          emp.documentos.some(doc => doc.fechaVencimiento && new Date(doc.fechaVencimiento) < new Date())
        ).length;
        
        const empresasConScoreAltoRiesgo = this.mockEmpresas.filter(emp => 
          (emp.scoreRiesgo || 0) > 70
        ).length;
        
        const promedioVehiculosPorEmpresa = this.mockEmpresas.length > 0 
          ? this.mockEmpresas.reduce((sum, emp) => sum + emp.vehiculosHabilitadosIds.length, 0) / this.mockEmpresas.length
          : 0;
        
        const promedioConductoresPorEmpresa = this.mockEmpresas.length > 0
          ? this.mockEmpresas.reduce((sum, emp) => sum + emp.conductoresHabilitadosIds.length, 0) / this.mockEmpresas.length
          : 0;
        
        return of({
          totalEmpresas,
          empresasHabilitadas,
          empresasEnTramite,
          empresasSuspendidas,
          empresasCanceladas,
          empresasDadasDeBaja,
          empresasConDocumentosVencidos,
          empresasConScoreAltoRiesgo,
          promedioVehiculosPorEmpresa: Math.round(promedioVehiculosPorEmpresa * 100) / 100,
          promedioConductoresPorEmpresa: Math.round(promedioConductoresPorEmpresa * 100) / 100
        });
      })
    );
  }

  // Métodos para gestión de vehículos
  agregarVehiculoAEmpresa(empresaId: string, vehiculoId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`, {
      headers: this.getHeaders()
    }).pipe(
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

  // Métodos para gestión de conductores
  agregarConductorAEmpresa(empresaId: string, conductorId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.get<{ empresa_id: string; resoluciones: string[]; total: number }>(`${this.apiUrl}/empresas/${empresaId}/resoluciones`, {
      headers: this.getHeaders()
    }).pipe(
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
    return this.http.get<{ valido: boolean; empresa?: Empresa }>(`${this.apiUrl}/empresas/validar-ruc/${ruc}`, {
      headers: this.getHeaders()
    }).pipe(
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
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.log('Error exportando empresas:', error);
        // Crear un blob mock para desarrollo
        const data = this.mockEmpresas.map(emp => ({
          RUC: emp.ruc,
          'RAZÓN SOCIAL': emp.razonSocial.principal,
          ESTADO: emp.estado,
          'FECHA REGISTRO': emp.fechaRegistro.toLocaleDateString('es-ES'),
          REPRESENTANTE: `${emp.representanteLegal.nombres} ${emp.representanteLegal.apellidos}`,
          'TELÉFONO': emp.telefonoContacto,
          EMAIL: emp.emailContacto
        }));
        
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        return of(blob);
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

  // Métodos auxiliares
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
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

  // Método para validación SUNAT
  validarEmpresaSunat(ruc: string): Observable<any> {
    // Simulación de validación SUNAT
    return of({
      valido: true,
      razonSocial: 'EMPRESA VALIDADA',
      estado: 'ACTIVO',
      condicion: 'HABIDO',
      direccion: 'DIRECCIÓN VALIDADA',
      fechaActualizacion: new Date()
    }).pipe(
      catchError(error => {
        return of({
          valido: false,
          error: 'Error en validación SUNAT: ' + error.message
        });
      })
    );
  }


} 