import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Resolucion, ResolucionCreate, ResolucionUpdate } from '../models/resolucion.model';

@Injectable({
  providedIn: 'root'
})
export class ResolucionService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Método para generar número de resolución completo
  // Ya no se usa, se genera directamente en createResolucion
  // private generarNumeroResolucion(numero: string, fechaEmision: Date): string {
  //   const anio = fechaEmision.getFullYear();
  //   return `R-${numero}-${anio}`;
  // }

  // Datos mock para desarrollo
  private mockResoluciones: Resolucion[] = [
    {
      id: '1',
      nroResolucion: 'R-0001-2025',
      empresaId: '1',
      expedienteId: '1',
      fechaEmision: new Date('2025-01-15'),
      fechaVigenciaInicio: new Date('2025-01-15'),
      fechaVigenciaFin: new Date('2030-01-15'),
      tipoResolucion: 'PADRE',
      resolucionPadreId: undefined,
      resolucionesHijasIds: ['2', '3'],
      vehiculosHabilitadosIds: ['1', '2'],
      rutasAutorizadasIds: ['1'],
      tipoTramite: 'AUTORIZACION NUEVA',
      descripcion: 'Autorización para operar transporte público',
      documentoId: 'doc1',
      estaActivo: true,
      estado: 'VIGENTE',
      fechaRegistro: new Date('2025-01-15'),
      fechaActualizacion: new Date('2025-01-15'),
      usuarioEmisionId: 'user1',
      usuarioAprobacionId: 'user1',
      fechaAprobacion: new Date('2025-01-15'),
      documentos: [],
      auditoria: []
    },
    {
      id: '2',
      nroResolucion: 'R-0002-2025',
      empresaId: '1',
      expedienteId: '2',
      fechaEmision: new Date('2025-06-01'),
      fechaVigenciaInicio: new Date('2025-06-01'),
      fechaVigenciaFin: new Date('2030-06-01'),
      tipoResolucion: 'PADRE',
      resolucionPadreId: undefined,
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: ['3'],
      rutasAutorizadasIds: ['2'],
      tipoTramite: 'RENOVACION',
      descripcion: 'Renovación de autorización de transporte',
      documentoId: 'doc2',
      estaActivo: true,
      estado: 'VIGENTE',
      fechaRegistro: new Date('2025-06-01'),
      fechaActualizacion: new Date('2025-06-01'),
      usuarioEmisionId: 'user1',
      usuarioAprobacionId: 'user1',
      fechaAprobacion: new Date('2025-06-01'),
      documentos: [],
      auditoria: []
    },
    {
      id: '3',
      nroResolucion: 'R-0003-2025',
      empresaId: '1',
      expedienteId: '3',
      fechaEmision: new Date('2025-08-15'),
      tipoResolucion: 'HIJO',
      resolucionPadreId: '1',
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: ['4'],
      rutasAutorizadasIds: ['3'],
      tipoTramite: 'INCREMENTO',
      descripcion: 'Incremento de flota vehicular',
      documentoId: 'doc3',
      estaActivo: true,
      estado: 'VIGENTE',
      fechaRegistro: new Date('2025-08-15'),
      fechaActualizacion: new Date('2025-08-15'),
      usuarioEmisionId: 'user1',
      usuarioAprobacionId: 'user1',
      fechaAprobacion: new Date('2025-08-15'),
      documentos: [],
      auditoria: []
    },
    {
      id: '4',
      nroResolucion: 'R-0001-2026',
      empresaId: '2',
      expedienteId: '4',
      fechaEmision: new Date('2026-01-10'),
      fechaVigenciaInicio: new Date('2026-01-10'),
      fechaVigenciaFin: new Date('2031-01-10'),
      tipoResolucion: 'PADRE',
      resolucionPadreId: undefined,
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: ['5', '6'],
      rutasAutorizadasIds: ['4', '5'],
      tipoTramite: 'AUTORIZACION NUEVA',
      descripcion: 'Nueva autorización para empresa del año 2026',
      documentoId: 'doc4',
      estaActivo: true,
      estado: 'VIGENTE',
      fechaRegistro: new Date('2026-01-10'),
      fechaActualizacion: new Date('2026-01-10'),
      usuarioEmisionId: 'user1',
      usuarioAprobacionId: 'user1',
      fechaAprobacion: new Date('2026-01-10'),
      documentos: [],
      auditoria: []
    },
    {
      id: '5',
      nroResolucion: 'R-0002-2026',
      empresaId: '2',
      expedienteId: '5',
      fechaEmision: new Date('2026-03-15'),
      fechaVigenciaInicio: new Date('2026-03-15'),
      fechaVigenciaFin: new Date('2031-03-15'),
      tipoResolucion: 'PADRE',
      resolucionPadreId: undefined,
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: ['7', '8'],
      rutasAutorizadasIds: ['6', '7'],
      tipoTramite: 'RENOVACION',
      descripcion: 'Renovación de autorización para empresa Juliaca',
      documentoId: 'doc5',
      estaActivo: true,
      estado: 'VIGENTE',
      fechaRegistro: new Date('2026-03-15'),
      fechaActualizacion: new Date('2026-03-15'),
      usuarioEmisionId: 'user1',
      usuarioAprobacionId: 'user1',
      fechaAprobacion: new Date('2026-03-15'),
      documentos: [],
      auditoria: []
    },
    {
      id: '6',
      nroResolucion: 'R-0001-2027',
      empresaId: '3',
      expedienteId: '6',
      fechaEmision: new Date('2027-01-20'),
      fechaVigenciaInicio: new Date('2027-01-20'),
      fechaVigenciaFin: new Date('2032-01-20'),
      tipoResolucion: 'PADRE',
      resolucionPadreId: undefined,
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: ['9', '10'],
      rutasAutorizadasIds: ['8', '9'],
      tipoTramite: 'AUTORIZACION NUEVA',
      descripcion: 'Nueva autorización para empresa del año 2027',
      documentoId: 'doc6',
      estaActivo: true,
      estado: 'VIGENTE',
      fechaRegistro: new Date('2027-01-20'),
      fechaActualizacion: new Date('2027-01-20'),
      usuarioEmisionId: 'user1',
      usuarioAprobacionId: 'user1',
      fechaAprobacion: new Date('2027-01-20'),
      documentos: [],
      auditoria: []
    },
    {
      id: '7',
      nroResolucion: 'R-0002-2026',
      empresaId: '3',
      expedienteId: '7',
      fechaEmision: new Date('2026-02-15'),
      fechaVigenciaInicio: new Date('2026-02-15'),
      fechaVigenciaFin: new Date('2031-02-15'),
      tipoResolucion: 'PADRE',
      resolucionPadreId: undefined,
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: ['7'],
      rutasAutorizadasIds: ['6'],
      tipoTramite: 'RENOVACION',
      descripcion: 'Renovación para empresa del año 2026',
      documentoId: 'doc7',
      estaActivo: true,
      estado: 'VIGENTE',
      fechaRegistro: new Date('2026-02-15'),
      fechaActualizacion: new Date('2026-02-15'),
      usuarioEmisionId: 'user1',
      usuarioAprobacionId: 'user1',
      fechaAprobacion: new Date('2026-02-15'),
      documentos: [],
      auditoria: []
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

  getResoluciones(skip: number = 0, limit: number = 100, estado?: string, empresaId?: string, tipo?: string): Observable<Resolucion[]> {
    const url = `${this.apiUrl}/resoluciones`;
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    if (limit !== 100) params.append('limit', limit.toString());
    if (estado) params.append('estado', estado);
    if (empresaId) params.append('empresa_id', empresaId);
    if (tipo) params.append('tipo_tramite', tipo); // Cambiar a tipo_tramite para el backend

    return this.http.get<Resolucion[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching resoluciones:', error);
          // Retornar datos mock en caso de error
          let mockResoluciones = this.mockResoluciones;
          if (estado) {
            mockResoluciones = mockResoluciones.filter(r => r.estado === estado);
          }
          if (empresaId) {
            mockResoluciones = mockResoluciones.filter(r => r.empresaId === empresaId);
          }
          if (tipo) {
            mockResoluciones = mockResoluciones.filter(r => r.tipoTramite === tipo);
          }
          return of(mockResoluciones);
        })
      );
  }

  getResolucionById(id: string): Observable<Resolucion> {
    const url = `${this.apiUrl}/resoluciones/${id}`;
    
    return this.http.get<Resolucion>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching resolucion:', error);
          // Retornar resolución mock en caso de error
          const mockResolucion = this.mockResoluciones.find(r => r.id === id);
          if (mockResolucion) {
            return of(mockResolucion);
          }
          return throwError(() => new Error('Resolución no encontrada'));
        })
      );
  }

  createResolucion(resolucion: ResolucionCreate): Observable<Resolucion> {
    // Validar que el número sea único por año
    if (!this.validarNumeroUnicoPorAnio(resolucion.numero, resolucion.fechaEmision)) {
      const anio = new Date(resolucion.fechaEmision).getFullYear();
      return throwError(() => new Error(`Ya existe una resolución con el número ${resolucion.numero} en el año ${anio}`));
    }
    
    const url = `${this.apiUrl}/resoluciones`;
    
    // Preparar datos para el backend
    const resolucionBackend: any = {
      nroResolucion: `R-${resolucion.numero}-${new Date(resolucion.fechaEmision).getFullYear()}`,
      empresaId: resolucion.empresaId,
      expedienteId: resolucion.expedienteId,
      fechaEmision: resolucion.fechaEmision,
      tipoResolucion: resolucion.tipoResolucion,
      resolucionPadreId: resolucion.resolucionPadreId,
      vehiculosHabilitadosIds: resolucion.vehiculosHabilitadosIds || [],
      rutasAutorizadasIds: resolucion.rutasAutorizadasIds || [],
      tipoTramite: resolucion.tipoTramite,
      descripcion: resolucion.descripcion,
      usuarioEmisionId: '1' // Usuario por defecto
    };
    
    // Solo incluir fechas de vigencia si están definidas
    if (resolucion.fechaVigenciaInicio) {
      resolucionBackend.fechaVigenciaInicio = resolucion.fechaVigenciaInicio;
    }
    if (resolucion.fechaVigenciaFin) {
      resolucionBackend.fechaVigenciaFin = resolucion.fechaVigenciaFin;
    }
    
    console.log('Creando resolución en backend:', resolucionBackend);
    console.log('URL del backend:', url);
    console.log('Headers:', this.getHeaders());
    
    return this.http.post<Resolucion>(url, resolucionBackend, { headers: this.getHeaders() })
      .pipe(
        tap(resolucionCreada => {
          console.log('Resolución creada exitosamente en backend:', resolucionCreada);
          // Agregar también a los datos mock para consistencia
          this.mockResoluciones.push(resolucionCreada);
        }),
        catchError(error => {
          console.error('Error creating resolucion in backend:', error);
          
          // Fallback: crear en datos mock si falla el backend
          console.log('Usando fallback a datos mock...');
          
          const numeroCompleto = `R-${resolucion.numero}-${new Date(resolucion.fechaEmision).getFullYear()}`;
          const nuevaResolucion: Resolucion = {
            id: (this.mockResoluciones.length + 1).toString(),
            nroResolucion: numeroCompleto,
            empresaId: resolucion.empresaId,
            expedienteId: resolucion.expedienteId,
            fechaEmision: resolucion.fechaEmision,
            fechaVigenciaInicio: resolucion.fechaVigenciaInicio,
            fechaVigenciaFin: resolucion.fechaVigenciaFin,
            tipoResolucion: resolucion.tipoResolucion,
            resolucionPadreId: resolucion.resolucionPadreId,
            resolucionesHijasIds: [],
            vehiculosHabilitadosIds: resolucion.vehiculosHabilitadosIds || [],
            rutasAutorizadasIds: resolucion.rutasAutorizadasIds || [],
            tipoTramite: resolucion.tipoTramite,
            descripcion: resolucion.descripcion,
            documentoId: undefined,
            estaActivo: true,
            estado: 'VIGENTE',
            fechaRegistro: new Date(),
            fechaActualizacion: new Date(),
            usuarioEmisionId: 'user1',
            usuarioAprobacionId: 'user1',
            fechaAprobacion: new Date(),
            documentos: [],
            auditoria: []
          };
          
          this.mockResoluciones.push(nuevaResolucion);
          return of(nuevaResolucion);
        })
      );
  }

  updateResolucion(id: string, resolucion: ResolucionUpdate): Observable<Resolucion> {
    const url = `${this.apiUrl}/resoluciones/${id}`;
    
    return this.http.put<Resolucion>(url, resolucion, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating resolucion:', error);
          // Actualizar resolución mock en caso de error
          const index = this.mockResoluciones.findIndex(r => r.id === id);
          if (index !== -1) {
            this.mockResoluciones[index] = { ...this.mockResoluciones[index], ...resolucion };
            return of(this.mockResoluciones[index]);
          }
          return throwError(() => new Error('Resolución no encontrada'));
        })
      );
  }

  deleteResolucion(id: string): Observable<void> {
    const url = `${this.apiUrl}/resoluciones/${id}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting resolucion:', error);
          // Eliminar resolución mock en caso de error
          const index = this.mockResoluciones.findIndex(r => r.id === id);
          if (index !== -1) {
            this.mockResoluciones.splice(index, 1);
          }
          return of(void 0);
        })
      );
  }

  getResolucionesPorEmpresa(empresaId: string): Observable<Resolucion[]> {
    console.log('=== INICIO getResolucionesPorEmpresa ===');
    console.log('Empresa ID solicitada:', empresaId);
    console.log('Total de resoluciones mock disponibles:', this.mockResoluciones.length);
    
    const url = `${this.apiUrl}/resoluciones`;
    const params = new URLSearchParams();
    params.append('empresa_id', empresaId);

    console.log('Intentando hacer HTTP GET a:', `${url}?${params.toString()}`);

    return this.http.get<Resolucion[]>(`${url}?${params.toString()}`, { headers: this.getHeaders() })
      .pipe(
        tap((resoluciones: Resolucion[]) => {
          console.log('=== DATOS DEL BACKEND ===');
          console.log('Resoluciones recibidas del backend:', resoluciones);
          console.log('Total de resoluciones del backend:', resoluciones.length);
          
          // Log detallado de cada resolución del backend
          resoluciones.forEach((r: Resolucion, index: number) => {
            console.log(`Resolución backend ${index + 1}:`, {
              id: r.id,
              nroResolucion: r.nroResolucion,
              empresaId: r.empresaId,
              tipoResolucion: r.tipoResolucion,
              estado: r.estado,
              estaActivo: r.estaActivo,
              // Log completo para debugging
              objetoCompleto: r
            });
          });
          console.log('=== FIN DATOS DEL BACKEND ===');
        }),
        catchError(error => {
          console.error('Error fetching resoluciones por empresa:', error);
          console.log('Usando datos mock como fallback...');
          
          // Retornar resoluciones mock filtradas por empresa
          const resolucionesFiltradas = this.mockResoluciones.filter(r => r.empresaId === empresaId && r.estaActivo);
          console.log('Resoluciones mock filtradas por empresa:', empresaId, resolucionesFiltradas);
          
          // Log detallado de cada resolución para debugging
          resolucionesFiltradas.forEach((r, index) => {
            console.log(`Resolución mock ${index + 1}:`, {
              id: r.id,
              nroResolucion: r.nroResolucion,
              empresaId: r.empresaId,
              tipoResolucion: r.tipoResolucion,
              estado: r.estado,
              estaActivo: r.estaActivo
            });
          });
          
          console.log('=== FIN getResolucionesPorEmpresa (MOCK FALLBACK) ===');
          return of(resolucionesFiltradas);
        })
      );
  }

  agregarResolucionAEmpresa(empresaId: string, resolucionId: string): Observable<Resolucion> {
    const url = `${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`;
    
    return this.http.post<Resolucion>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error adding resolucion to empresa:', error);
          // Simular éxito en caso de error
          const resolucion = this.mockResoluciones.find(r => r.id === resolucionId);
          if (resolucion) {
            return of(resolucion);
          }
          return throwError(() => new Error('Resolución no encontrada'));
        })
      );
  }

  removerResolucionDeEmpresa(empresaId: string, resolucionId: string): Observable<void> {
    const url = `${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error removing resolucion from empresa:', error);
          // Simular éxito en caso de error
          return of(void 0);
        })
      );
  }

  getResolucionesByTipo(tipo: string): Observable<Resolucion[]> {
    // Filtrar por tipo de resolución (PADRE o HIJO)
    const mockResoluciones = this.mockResoluciones.filter(r => r.tipoResolucion === tipo);
    return of(mockResoluciones);
  }

  getResolucionesByTipoTramite(tipoTramite: string): Observable<Resolucion[]> {
    // Filtrar por tipo de trámite
    const mockResoluciones = this.mockResoluciones.filter(r => r.tipoTramite === tipoTramite);
    return of(mockResoluciones);
  }

  /**
   * Validar que el número de resolución sea único por año
   * @param numero Número de resolución (ej: "0001")
   * @param fechaEmision Fecha de emisión para obtener el año
   * @returns true si es único, false si ya existe
   */
  validarNumeroUnicoPorAnio(numero: string, fechaEmision: Date): boolean {
    const anio = fechaEmision.getFullYear();
    const numeroCompleto = `R-${numero}-${anio}`;
    
    console.log('=== VALIDACIÓN NÚMERO ÚNICO ===');
    console.log('Número a validar:', numero);
    console.log('Año:', anio);
    console.log('Número completo generado:', numeroCompleto);
    console.log('Resoluciones existentes:', this.mockResoluciones.map(r => r.nroResolucion));
    
    // Buscar si ya existe una resolución con el mismo número en el mismo año
    const existe = this.mockResoluciones.find(r => r.nroResolucion === numeroCompleto);
    console.log('¿Existe resolución con este número?', !!existe);
    if (existe) {
      console.log('Resolución encontrada:', existe);
    }
    
    const esUnico = !existe;
    console.log('Resultado de validación:', esUnico);
    console.log('=== FIN VALIDACIÓN ===');
    
    return esUnico; // Retorna true si es único (no existe), false si ya existe
  }

  /**
   * Generar el siguiente número de resolución disponible para un año específico
   * @param fechaEmision Fecha de emisión para obtener el año
   * @returns Siguiente número disponible
   */
  generarSiguienteNumero(fechaEmision: Date): string {
    const anio = fechaEmision.getFullYear();
    
    console.log('=== GENERAR SIGUIENTE NÚMERO ===');
    console.log('Año solicitado:', anio);
    
    // Obtener todas las resoluciones del año
    const resolucionesDelAnio = this.mockResoluciones.filter(r => {
      const rAnio = parseInt(r.nroResolucion.split('-')[2]);
      return rAnio === anio;
    });
    
    console.log('Resoluciones del año', anio, ':', resolucionesDelAnio.map(r => r.nroResolucion));
    
    if (resolucionesDelAnio.length === 0) {
      console.log('No hay resoluciones este año, retornando 0001');
      return '0001'; // Primera resolución del año
    }
    
    // Obtener el número más alto del año
    const numeros = resolucionesDelAnio.map(r => {
      const numero = r.nroResolucion.split('-')[1];
      return parseInt(numero);
    });
    
    console.log('Números encontrados:', numeros);
    const siguienteNumero = Math.max(...numeros) + 1;
    const resultado = siguienteNumero.toString().padStart(4, '0');
    console.log('Siguiente número disponible:', resultado);
    console.log('=== FIN GENERAR SIGUIENTE NÚMERO ===');
    
    return resultado;
  }
} 