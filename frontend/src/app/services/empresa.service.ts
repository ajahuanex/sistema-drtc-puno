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
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = environment.apiUrl;

  // Datos mock para desarrollo
  private mockEmpresas: Empresa[] = [
    {
      id: '1',
      codigoEmpresa: '0001PRT',
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
          usuarioId: 'admin',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'Empresa creada con código: 0001PRT y RUC: 20123456789',
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
      codigoEmpresa: '0002PRT',
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
          usuarioId: 'admin',
          tipoCambio: 'CREACION_EMPRESA',
          campoAnterior: undefined,
          campoNuevo: 'Empresa creada con código: 0002PRT y RUC: 20456789012',
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
      observaciones: empresa.observaciones || '',
      codigoEmpresa: empresa.codigoEmpresa || ''
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

  // Generar número de TUC único
  generarNumeroTuc(): string {
    const año = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `T-${numero}-${año}`;
  }

  // Generar siguiente código de empresa disponible
  generarSiguienteCodigoEmpresa(): Observable<{siguienteCodigo: string, descripcion: string, formato: string}> {
    const url = `${this.apiUrl}/empresas/siguiente-codigo`;
    
    return this.http.get<{siguienteCodigo: string, descripcion: string, formato: string}>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error generando código de empresa:', error);
          // Fallback: generar código mock
          const numero = Math.floor(Math.random() * 9999) + 1;
          const codigo = `${numero.toString().padStart(4, '0')}PRT`;
          return of({
            siguienteCodigo: codigo,
            descripcion: 'Código único de empresa en formato 4 dígitos + 3 letras',
            formato: 'XXXXPRT (P: Personas, R: Regional, T: Turismo)'
          });
        })
      );
  }

  // Validar código de empresa
  validarCodigoEmpresa(codigo: string): Observable<{
    codigo: string;
    esValido: boolean;
    numeroSecuencial?: number;
    tiposEmpresa?: string[];
    descripcionTipos?: string;
    error?: string;
  }> {
    const url = `${this.apiUrl}/empresas/validar-codigo/${codigo}`;
    
    return this.http.get<{
      codigo: string;
      esValido: boolean;
      numeroSecuencial?: number;
      tiposEmpresa?: string[];
      descripcionTipos?: string;
      error?: string;
    }>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error validando código de empresa:', error);
          // Fallback: validación básica
          const esValido = /^\d{4}[PRT]{3}$/.test(codigo);
          return of({
            codigo,
            esValido,
            error: esValido ? undefined : 'Formato inválido. Debe ser 4 dígitos + 3 letras (ej: 0123PRT)'
          });
        })
      );
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA DESDE EXCEL
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva de empresas
   */
  async descargarPlantillaEmpresas(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/empresas/carga-masiva/plantilla`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_empresas.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error descargando plantilla:', error);
      
      // Fallback: generar plantilla CSV simple
      const csvContent = `Código Empresa,RUC,Razón Social Principal,Razón Social SUNAT,Razón Social Mínimo,Dirección Fiscal,Estado,DNI Representante,Nombres Representante,Apellidos Representante,Email Representante,Teléfono Representante,Dirección Representante,Email Contacto,Teléfono Contacto,Sitio Web,Observaciones
0001TRP,20123456789,TRANSPORTES PUNO S.A.,TRANSPORTES PUNO SOCIEDAD ANONIMA,TRANSPORTES PUNO,AV. EJERCITO 123 PUNO,HABILITADA,12345678,JUAN CARLOS,MAMANI QUISPE,juan.mamani@transportespuno.com,951234567,AV. SIMON BOLIVAR 789 PUNO,contacto@transportespuno.com,051-123456,www.transportespuno.com,Empresa con 15 años de experiencia
0002LOG,20987654321,LOGÍSTICA AREQUIPA E.I.R.L.,LOGISTICA AREQUIPA EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA,LOGISTICA AREQUIPA,JR. MERCADERES 456 AREQUIPA,HABILITADA,87654321,MARIA ELENA,RODRIGUEZ VARGAS,maria.rodriguez@logisticaarequipa.com,987654321,CALLE SANTA CATALINA 321 AREQUIPA,info@logisticaarequipa.com,054-987654,www.logisticaarequipa.com,Especializada en carga pesada`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_empresas.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  /**
   * Validar archivo Excel de empresas
   */
  validarArchivoEmpresas(archivo: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const xhr = new XMLHttpRequest();
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Error al procesar respuesta del servidor'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || 'Error al validar archivo'));
          } catch {
            reject(new Error(`Error del servidor: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        console.error('Error de red, simulando validación...');
        // Fallback: simular validación
        this.simularValidacionArchivo(archivo).then(resolve).catch(reject);
      };

      xhr.open('POST', `${this.apiUrl}/empresas/carga-masiva/validar`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.authService.getToken()}`);
      xhr.send(formData);
    });
  }

  /**
   * Procesar carga masiva de empresas
   */
  procesarCargaMasivaEmpresas(archivo: File, soloValidar: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const xhr = new XMLHttpRequest();
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Error al procesar respuesta del servidor'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || 'Error al procesar archivo'));
          } catch {
            reject(new Error(`Error del servidor: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        console.error('Error de red, simulando procesamiento...');
        // Fallback: simular procesamiento
        this.simularProcesamiento(archivo, soloValidar).then(resolve).catch(reject);
      };

      const url = `${this.apiUrl}/empresas/carga-masiva/procesar?solo_validar=${soloValidar}`;
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${this.authService.getToken()}`);
      xhr.send(formData);
    });
  }

  /**
   * Simular validación de archivo (fallback para desarrollo)
   */
  private async simularValidacionArchivo(archivo: File): Promise<any> {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      archivo: archivo.name,
      validacion: {
        total_filas: 2,
        validos: 1,
        invalidos: 1,
        con_advertencias: 0,
        errores: [
          {
            fila: 3,
            codigo_empresa: 'INVALID',
            errores: [
              'Formato de código de empresa inválido: INVALID (debe ser 4 dígitos + 3 letras, ej: 0123TRP)',
              'RUC debe tener 11 dígitos: 123456789'
            ]
          }
        ],
        advertencias: []
      },
      mensaje: 'Archivo validado: 1 válidos, 1 inválidos'
    };
  }

  /**
   * Simular procesamiento de archivo (fallback para desarrollo)
   */
  private async simularProcesamiento(archivo: File, soloValidar: boolean): Promise<any> {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));

    const validacion = await this.simularValidacionArchivo(archivo);

    if (soloValidar) {
      return {
        archivo: archivo.name,
        solo_validacion: true,
        resultado: validacion.validacion,
        mensaje: 'Validación completada: 1 válidos, 1 inválidos'
      };
    }

    return {
      archivo: archivo.name,
      solo_validacion: false,
      resultado: {
        ...validacion.validacion,
        empresas_creadas: [
          {
            codigo_empresa: '0001TRP',
            ruc: '20123456789',
            razon_social: 'TRANSPORTES PUNO S.A.',
            estado: 'CREADA'
          }
        ],
        errores_creacion: [],
        total_creadas: 1
      },
      mensaje: 'Procesamiento completado: 1 empresas creadas'
    };
  }

} 
