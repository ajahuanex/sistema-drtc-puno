import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, forkJoin } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { EmpresaService } from './empresa.service';
import { Resolucion, ResolucionCreate, ResolucionUpdate, TipoTramite } from '../models/resolucion.model';
import { ResolucionFiltros, ResolucionConEmpresa, EstadisticasResoluciones } from '../models/resolucion-table.model';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResolucionService {
  private apiUrl = environment.apiUrl;

  // Datos mock para desarrollo
  private mockResoluciones: Resolucion[] = [];

  private empresaService = inject(EmpresaService);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.inicializarDatosMock();
  }

  /**
   * Método para obtener el tipo de trámite desde el expediente
   * 
   * LÓGICA IMPLEMENTADA:
   * - El tipo de trámite de una resolución debe venir del expediente asociado
   * - Los expedientes determinan si una resolución es PADRE o HIJO:
   *   * PRIMIGENIA y RENOVACION → Resolución PADRE
   *   * INCREMENTO, SUSTITUCION, OTROS → Resolución HIJO
   * - Las resoluciones HIJO deben tener una resolución PADRE asociada
   * - El sistema mantiene la consistencia entre expedientes, empresas y resoluciones
   * 
   * MAPEO DE EXPEDIENTES:
   * - E-0001-2025 (ID: 1) → PRIMIGENIA → Resolución PADRE
   * - E-0002-2025 (ID: 2) → RENOVACION → Resolución PADRE  
   * - E-0003-2025 (ID: 3) → INCREMENTO → Resolución HIJO (depende de ID: 1)
   * - E-0001-2026 (ID: 4) → PRIMIGENIA → Resolución PADRE
   * - E-0002-2026 (ID: 5) → RENOVACION → Resolución PADRE
   * - E-0003-2026 (ID: 6) → INCREMENTO → Resolución HIJO (depende de ID: 4)
   * - E-0004-2026 (ID: 7) → SUSTITUCION → Resolución HIJO (depende de ID: 3)
   * - E-0005-2026 (ID: 8) → OTROS → Resolución HIJO (depende de ID: 1)
   * - E-0001-2027 (ID: 9) → PRIMIGENIA → Resolución PADRE
   * - E-0002-2027 (ID: 10) → RENOVACION → Resolución HIJO (depende de ID: 12)
   */
  private obtenerTipoTramiteDesdeExpediente(expedienteId: string): TipoTramite {
    // Mapeo de expedientes a tipos de trámite según los datos mock
    const mapeoExpedientes: { [key: string]: TipoTramite } = {
      '1': 'PRIMIGENIA',      // E-0001-2025
      '2': 'RENOVACION',      // E-0002-2025  
      '3': 'INCREMENTO',      // E-0003-2025
      '4': 'PRIMIGENIA',      // E-0001-2026
      '5': 'RENOVACION',      // E-0002-2026
      '6': 'INCREMENTO',      // E-0003-2026
      '7': 'SUSTITUCION',     // E-0004-2026
      '8': 'OTROS',           // E-0005-2026
      '9': 'PRIMIGENIA',      // E-0001-2027
      '10': 'RENOVACION'      // E-0002-2027
    };
    
    return mapeoExpedientes[expedienteId] || 'OTROS';
  }

  private inicializarDatosMock(): void {
    this.mockResoluciones = [
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
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('1'),
        descripcion: 'Resolución PRIMIGENIA para autorización de transporte público de pasajeros - autorización inicial por 5 años',
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
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('2'),
        descripcion: 'Resolución de RENOVACIÓN de autorización de transporte público de pasajeros - ampliación de vigencia por 5 años',
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
        fechaVigenciaInicio: new Date('2025-08-15'),
        fechaVigenciaFin: new Date('2030-08-15'),
        tipoResolucion: 'PADRE',
        resolucionPadreId: undefined,
        resolucionesHijasIds: ['11'],
        vehiculosHabilitadosIds: ['4'],
        rutasAutorizadasIds: ['3'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('3'),
        descripcion: 'Resolución de INCREMENTO de flota vehicular para ampliar cobertura de rutas autorizadas',
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
        resolucionesHijasIds: ['10'],
        vehiculosHabilitadosIds: ['5', '6'],
        rutasAutorizadasIds: ['4', '5'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('4'),
        descripcion: 'Resolución PRIMIGENIA para nueva empresa de transporte de carga pesada - autorización inicial',
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
        fechaEmision: new Date('2026-02-15'),
        fechaVigenciaInicio: new Date('2026-02-15'),
        fechaVigenciaFin: new Date('2031-02-15'),
        tipoResolucion: 'PADRE',
        resolucionPadreId: undefined,
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: ['7'],
        rutasAutorizadasIds: ['6'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('5'),
        descripcion: 'Resolución de RENOVACIÓN para empresa de transporte de carga pesada - ampliación de vigencia por 5 años',
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
      },
      {
        id: '6',
        nroResolucion: 'R-0003-2026',
        empresaId: '2',
        expedienteId: '6',
        fechaEmision: new Date('2026-02-15'),
        fechaVigenciaInicio: new Date('2026-02-15'),
        fechaVigenciaFin: new Date('2031-02-15'),
        tipoResolucion: 'HIJO',
        resolucionPadreId: '4',
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: ['7'],
        rutasAutorizadasIds: ['6'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('6'),
        descripcion: 'Resolución HIJA de INCREMENTO de flota vehicular - ampliación de capacidad de transporte',
        documentoId: 'doc10',
        estaActivo: true,
        estado: 'VIGENTE',
        fechaRegistro: new Date('2026-02-15'),
        fechaActualizacion: new Date('2026-02-15'),
        usuarioEmisionId: 'user1',
        usuarioAprobacionId: 'user1',
        fechaAprobacion: new Date('2026-02-15'),
        documentos: [],
        auditoria: []
      },
      {
        id: '7',
        nroResolucion: 'R-0004-2026',
        empresaId: '3',
        expedienteId: '7',
        fechaEmision: new Date('2026-03-10'),
        fechaVigenciaInicio: new Date('2026-03-10'),
        fechaVigenciaFin: new Date('2031-03-10'),
        tipoResolucion: 'HIJO',
        resolucionPadreId: '3',
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: ['8'],
        rutasAutorizadasIds: ['7'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('7'),
        descripcion: 'Resolución HIJA de SUSTITUCIÓN de vehículos en flota existente - modernización de unidades',
        documentoId: 'doc11',
        estaActivo: true,
        estado: 'VIGENTE',
        fechaRegistro: new Date('2026-03-10'),
        fechaActualizacion: new Date('2026-03-10'),
        usuarioEmisionId: 'user1',
        usuarioAprobacionId: 'user1',
        fechaAprobacion: new Date('2026-03-10'),
        documentos: [],
        auditoria: []
      },
      {
        id: '8',
        nroResolucion: 'R-0004-2025',
        empresaId: '1',
        expedienteId: '8',
        fechaEmision: new Date('2025-10-01'),
        fechaVigenciaInicio: new Date('2025-10-01'),
        fechaVigenciaFin: new Date('2030-10-01'),
        tipoResolucion: 'PADRE',
        resolucionPadreId: undefined,
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: ['5'],
        rutasAutorizadasIds: ['4'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('8'),
        descripcion: 'Resolución de modificación de rutas autorizadas - ampliación de cobertura urbana',
        documentoId: 'doc8',
        estaActivo: true,
        estado: 'VIGENTE',
        fechaRegistro: new Date('2025-10-01'),
        fechaActualizacion: new Date('2025-10-01'),
        usuarioEmisionId: 'user1',
        usuarioAprobacionId: 'user1',
        fechaAprobacion: new Date('2025-10-01'),
        documentos: [],
        auditoria: []
      },
      {
        id: '9',
        nroResolucion: 'R-0005-2025',
        empresaId: '1',
        expedienteId: '9',
        fechaEmision: new Date('2025-12-01'),
        fechaVigenciaInicio: new Date('2025-12-01'),
        fechaVigenciaFin: new Date('2030-12-01'),
        tipoResolucion: 'PADRE',
        resolucionPadreId: undefined,
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: ['6'],
        rutasAutorizadasIds: ['5'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('9'),
        descripcion: 'Resolución de nueva ruta interprovincial - ampliación de servicios de transporte',
        documentoId: 'doc9',
        estaActivo: true,
        estado: 'VIGENTE',
        fechaRegistro: new Date('2025-12-01'),
        fechaActualizacion: new Date('2025-12-01'),
        usuarioEmisionId: 'user1',
        usuarioAprobacionId: 'user1',
        fechaAprobacion: new Date('2025-12-01'),
        documentos: [],
        auditoria: []
      },
      {
        id: '10',
        nroResolucion: 'R-0001-2027',
        empresaId: '6',
        expedienteId: '9',
        fechaEmision: new Date('2027-01-20'),
        fechaVigenciaInicio: new Date('2027-01-20'),
        fechaVigenciaFin: new Date('2032-01-20'),
        tipoResolucion: 'PADRE',
        resolucionPadreId: undefined,
        resolucionesHijasIds: ['13'],
        vehiculosHabilitadosIds: ['10', '11'],
        rutasAutorizadasIds: ['9', '10'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('9'),
        descripcion: 'Resolución PRIMIGENIA para empresa de transporte turístico especializado - autorización inicial',
        documentoId: 'doc12',
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
        id: '11',
        nroResolucion: 'R-0002-2027',
        empresaId: '6',
        expedienteId: '10',
        fechaEmision: new Date('2027-02-15'),
        fechaVigenciaInicio: new Date('2027-02-15'),
        fechaVigenciaFin: new Date('2032-02-15'),
        tipoResolucion: 'HIJO',
        resolucionPadreId: '10',
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: ['12'],
        rutasAutorizadasIds: ['11'],
        tipoTramite: this.obtenerTipoTramiteDesdeExpediente('10'),
        descripcion: 'Resolución HIJA de RENOVACIÓN para empresa de transporte turístico - mantenimiento de servicios',
        documentoId: 'doc13',
        estaActivo: true,
        estado: 'VIGENTE',
        fechaRegistro: new Date('2027-02-15'),
        fechaActualizacion: new Date('2027-02-15'),
        usuarioEmisionId: 'user1',
        usuarioAprobacionId: 'user1',
        fechaAprobacion: new Date('2027-02-15'),
        documentos: [],
        auditoria: []
      }
    ];
  }

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
    if (tipo) params.append('tipo_tramite', tipo);

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

  /**
   * Valida que el número de resolución sea único para el año especificado
   * @param numero - Número de resolución a validar
   * @param fechaEmision - Fecha de emisión para determinar el año
   * @returns true si el número es único, false si ya existe
   */
  private validarNumeroUnicoPorAnio(numero: string, fechaEmision: Date): boolean {
    const anio = new Date(fechaEmision).getFullYear();
    const numeroCompleto = `R-${numero}-${anio}`;
    
    // Verificar en datos mock
    const existe = this.mockResoluciones.some(r => r.nroResolucion === numeroCompleto);
    
    if (existe) {
      console.warn(`Ya existe una resolución con el número ${numeroCompleto}`);
      return false;
    }
    
    return true;
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
      fechaVigenciaInicio: resolucion.fechaVigenciaInicio || null,
      fechaVigenciaFin: resolucion.fechaVigenciaFin || null,
      tipoResolucion: resolucion.tipoResolucion,
      resolucionPadreId: resolucion.resolucionPadreId || null,
      resolucionesHijasIds: [],
      vehiculosHabilitadosIds: resolucion.vehiculosHabilitadosIds || [],
      rutasAutorizadasIds: resolucion.rutasAutorizadasIds || [],
      tipoTramite: resolucion.tipoTramite,
      descripcion: resolucion.descripcion,
      documentoId: null,
      estaActivo: true,
      fechaRegistro: new Date(),
      fechaActualizacion: null,
      usuarioEmisionId: '1', // Usuario por defecto
      observaciones: resolucion.observaciones || null,
      estado: 'VIGENTE',
      motivoSuspension: null,
      fechaSuspension: null,
      usuarioSuspensionId: null,
      motivoAnulacion: null,
      fechaAnulacion: null,
      usuarioAnulacionId: null
    };
    
    console.log('Creando resolución en backend:', resolucionBackend);
    console.log('URL del backend:', url);
    console.log('Headers:', this.getHeaders());
    
    return this.http.post<Resolucion>(url, resolucionBackend, { headers: this.getHeaders() })
      .pipe(
        tap(resolucionCreada => {
          console.log('Resolución creada exitosamente en backend:', resolucionCreada);
          // Agregar también a los datos mock para consistencia
          const nuevaResolucion: Resolucion = {
            id: resolucionCreada.id || (this.mockResoluciones.length + 1).toString(),
            nroResolucion: resolucionCreada.nroResolucion,
            empresaId: resolucionCreada.empresaId,
            expedienteId: resolucionCreada.expedienteId,
            fechaEmision: resolucionCreada.fechaEmision,
            fechaVigenciaInicio: resolucionCreada.fechaVigenciaInicio,
            fechaVigenciaFin: resolucionCreada.fechaVigenciaFin,
            tipoResolucion: resolucionCreada.tipoResolucion,
            resolucionPadreId: resolucionCreada.resolucionPadreId,
            resolucionesHijasIds: resolucionCreada.resolucionesHijasIds || [],
            vehiculosHabilitadosIds: resolucionCreada.vehiculosHabilitadosIds || [],
            rutasAutorizadasIds: resolucionCreada.rutasAutorizadasIds || [],
            tipoTramite: resolucionCreada.tipoTramite,
            descripcion: resolucionCreada.descripcion,
            documentoId: resolucionCreada.documentoId,
            estaActivo: resolucionCreada.estaActivo || true,
            estado: resolucionCreada.estado || 'VIGENTE',
            fechaRegistro: resolucionCreada.fechaRegistro || new Date(),
            fechaActualizacion: resolucionCreada.fechaActualizacion || new Date(),
            usuarioEmisionId: resolucionCreada.usuarioEmisionId || 'user1',
            usuarioAprobacionId: resolucionCreada.usuarioAprobacionId || 'user1',
            fechaAprobacion: resolucionCreada.fechaAprobacion || new Date(),
            documentos: resolucionCreada.documentos || [],
            auditoria: resolucionCreada.auditoria || []
          };
          this.mockResoluciones.push(nuevaResolucion);
          console.log('Resolución agregada a datos mock:', nuevaResolucion);
          console.log('Total de resoluciones mock después de agregar:', this.mockResoluciones.length);
          
          // Si es resolución hija, actualizar la resolución padre
          if (nuevaResolucion.resolucionPadreId) {
            const indexPadre = this.mockResoluciones.findIndex(r => r.id === nuevaResolucion.resolucionPadreId);
            if (indexPadre !== -1) {
              this.mockResoluciones[indexPadre].resolucionesHijasIds.push(nuevaResolucion.id);
              console.log('Resolución padre actualizada con nueva hija:', this.mockResoluciones[indexPadre]);
            } else {
              console.warn('⚠️ No se encontró la resolución padre para actualizar:', nuevaResolucion.resolucionPadreId);
            }
          }
        }),
        catchError(error => {
          console.error('Error creating resolucion in backend:', error);
          
          // Fallback: crear en datos mock si falla el backend
          console.log('Usando fallback a datos mock...');
          
          const numeroCompleto = `R-${resolucion.numero}-${new Date(resolucion.fechaEmision).getFullYear()}`;
          const nuevaResolucion: Resolucion = {
            id: Date.now().toString(), // Usar timestamp para ID único
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
          console.log('Resolución agregada a datos mock (fallback):', nuevaResolucion);
          console.log('Total de resoluciones mock después de agregar (fallback):', this.mockResoluciones.length);
          
          // Si es resolución hija, actualizar la resolución padre
          if (nuevaResolucion.resolucionPadreId) {
            const indexPadre = this.mockResoluciones.findIndex(r => r.id === nuevaResolucion.resolucionPadreId);
            if (indexPadre !== -1) {
              this.mockResoluciones[indexPadre].resolucionesHijasIds.push(nuevaResolucion.id);
              console.log('Resolución padre actualizada con nueva hija (fallback):', this.mockResoluciones[indexPadre]);
            } else {
              console.warn('⚠️ No se encontró la resolución padre para actualizar (fallback):', nuevaResolucion.resolucionPadreId);
            }
          }
          
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

  // Método para debuggear el estado actual de los datos mock
  debugMockData(): void {
    console.log('=== DEBUG DATOS MOCK ===');
    console.log('Total de resoluciones mock:', this.mockResoluciones.length);
    console.log('Resoluciones por empresa:');
    
    const empresas = Array.from(new Set(this.mockResoluciones.map(r => r.empresaId)));
    empresas.forEach(empresaId => {
      const resolucionesEmpresa = this.mockResoluciones.filter(r => r.empresaId === empresaId);
      console.log(`Empresa ${empresaId}:`, resolucionesEmpresa.length);
    });
  }

  /**
   * Obtiene resoluciones filtradas según los criterios especificados
   * @param filtros - Objeto con los criterios de filtrado
   * @returns Observable con las resoluciones filtradas
   */
  getResolucionesFiltradas(filtros: ResolucionFiltros): Observable<ResolucionConEmpresa[]> {
    console.log('=== getResolucionesFiltradas ===');
    console.log('Filtros recibidos:', filtros);

    // Iniciar medición de rendimiento
    PerformanceMonitor.startMeasure('getResolucionesFiltradas');

    // Intentar obtener del backend primero
    const url = `${this.apiUrl}/resoluciones/filtradas`;
    
    return this.http.post<Resolucion[]>(url, filtros, { headers: this.getHeaders() })
      .pipe(
        switchMap((resoluciones: Resolucion[]) => {
          console.log('Resoluciones del backend:', resoluciones.length);
          return this.enrichResolucionesConEmpresa(resoluciones);
        }),
        tap(resoluciones => {
          // Finalizar medición y registrar métricas
          const executionTime = PerformanceMonitor.endMeasure('getResolucionesFiltradas');
          PerformanceMonitor.recordFilterMetrics({
            filterType: 'backend',
            executionTime,
            resultCount: resoluciones.length,
            datasetSize: this.mockResoluciones.length,
            timestamp: new Date()
          });
        }),
        catchError(error => {
          console.error('Error fetching filtered resoluciones from backend:', error);
          console.log('Usando datos mock con filtrado local...');
          
          // Reiniciar medición para filtrado local
          PerformanceMonitor.startMeasure('getResolucionesFiltradas-local');
          
          // Aplicar filtros a los datos mock
          let resolucionesFiltradas = [...this.mockResoluciones];

          // Filtro por número de resolución
          if (filtros.numeroResolucion) {
            const numeroLower = filtros.numeroResolucion.toLowerCase();
            resolucionesFiltradas = resolucionesFiltradas.filter(r => 
              r.nroResolucion.toLowerCase().includes(numeroLower)
            );
          }

          // Filtro por empresa
          if (filtros.empresaId) {
            resolucionesFiltradas = resolucionesFiltradas.filter(r => 
              r.empresaId === filtros.empresaId
            );
          }

          // Filtro por tipos de trámite (múltiple)
          if (filtros.tiposTramite && filtros.tiposTramite.length > 0) {
            resolucionesFiltradas = resolucionesFiltradas.filter(r => 
              filtros.tiposTramite!.includes(r.tipoTramite)
            );
          }

          // Filtro por estados (múltiple)
          if (filtros.estados && filtros.estados.length > 0) {
            resolucionesFiltradas = resolucionesFiltradas.filter(r => 
              r.estado && filtros.estados!.includes(r.estado)
            );
          }

          // Filtro por rango de fechas
          if (filtros.fechaInicio) {
            const fechaInicio = new Date(filtros.fechaInicio);
            fechaInicio.setHours(0, 0, 0, 0);
            resolucionesFiltradas = resolucionesFiltradas.filter(r => {
              const fechaEmision = new Date(r.fechaEmision);
              fechaEmision.setHours(0, 0, 0, 0);
              return fechaEmision >= fechaInicio;
            });
          }

          if (filtros.fechaFin) {
            const fechaFin = new Date(filtros.fechaFin);
            fechaFin.setHours(23, 59, 59, 999);
            resolucionesFiltradas = resolucionesFiltradas.filter(r => {
              const fechaEmision = new Date(r.fechaEmision);
              return fechaEmision <= fechaFin;
            });
          }

          // Filtro por activo
          if (filtros.activo !== undefined) {
            resolucionesFiltradas = resolucionesFiltradas.filter(r => 
              r.estaActivo === filtros.activo
            );
          }

          console.log('Resoluciones filtradas (mock):', resolucionesFiltradas.length);
          
          // Enriquecer con datos de empresa
          return this.enrichResolucionesConEmpresa(resolucionesFiltradas).pipe(
            tap(resoluciones => {
              // Finalizar medición y registrar métricas
              const executionTime = PerformanceMonitor.endMeasure('getResolucionesFiltradas-local');
              PerformanceMonitor.recordFilterMetrics({
                filterType: 'local-mock',
                executionTime,
                resultCount: resoluciones.length,
                datasetSize: this.mockResoluciones.length,
                timestamp: new Date()
              });
            })
          );
        })
      );
  }

  /**
   * Obtiene resoluciones con datos de empresa incluidos
   * @returns Observable con las resoluciones enriquecidas con datos de empresa
   */
  getResolucionesConEmpresa(): Observable<ResolucionConEmpresa[]> {
    console.log('=== getResolucionesConEmpresa ===');
    
    return this.getResoluciones().pipe(
      switchMap((resoluciones: Resolucion[]) => {
        return this.enrichResolucionesConEmpresa(resoluciones);
      })
    );
  }

  /**
   * Enriquece las resoluciones con datos de empresa
   * @param resoluciones - Array de resoluciones a enriquecer
   * @returns Observable con las resoluciones enriquecidas
   */
  private enrichResolucionesConEmpresa(resoluciones: Resolucion[]): Observable<ResolucionConEmpresa[]> {
    if (resoluciones.length === 0) {
      return of([]);
    }

    // Obtener IDs únicos de empresas
    const empresaIds = Array.from(new Set(resoluciones.map(r => r.empresaId)));
    
    // Obtener datos de todas las empresas en paralelo
    const empresasObservables = empresaIds.map(id => 
      this.empresaService.getEmpresa(id).pipe(
        catchError(error => {
          console.error(`Error fetching empresa ${id}:`, error);
          return of(null);
        })
      )
    );

    return forkJoin(empresasObservables).pipe(
      map(empresas => {
        // Crear un mapa de empresas por ID
        const empresaMap = new Map();
        empresas.forEach((empresa, index) => {
          if (empresa) {
            empresaMap.set(empresaIds[index], empresa);
          }
        });

        // Enriquecer resoluciones con datos de empresa
        const resolucionesConEmpresa: ResolucionConEmpresa[] = resoluciones.map(resolucion => {
          const empresa = empresaMap.get(resolucion.empresaId);
          
          if (empresa) {
            return {
              ...resolucion,
              empresa: {
                id: empresa.id,
                razonSocial: {
                  principal: empresa.razonSocial.principal,
                  comercial: empresa.razonSocial.minimo
                },
                ruc: empresa.ruc
              }
            };
          }
          
          // Si no se encuentra la empresa, retornar sin datos de empresa
          return {
            ...resolucion,
            empresa: undefined
          };
        });

        console.log('Resoluciones enriquecidas con empresa:', resolucionesConEmpresa.length);
        return resolucionesConEmpresa;
      })
    );
  }

  /**
   * Exporta resoluciones en el formato especificado
   * @param filtros - Filtros aplicados a las resoluciones
   * @param formato - Formato de exportación ('excel' o 'pdf')
   * @returns Observable con el blob del archivo exportado
   */
  exportarResoluciones(filtros: ResolucionFiltros, formato: 'excel' | 'pdf' = 'excel'): Observable<Blob> {
    console.log('=== exportarResoluciones ===');
    console.log('Formato:', formato);
    console.log('Filtros:', filtros);

    const url = `${this.apiUrl}/resoluciones/exportar`;
    const params = new URLSearchParams();
    params.append('formato', formato);

    return this.http.post(
      `${url}?${params.toString()}`,
      filtros,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    ).pipe(
      catchError(error => {
        console.error('Error exporting resoluciones:', error);
        
        // Fallback: generar exportación local simple
        return this.getResolucionesFiltradas(filtros).pipe(
          map(resoluciones => {
            // Crear un CSV simple como fallback
            const headers = ['Número', 'Empresa', 'Tipo Trámite', 'Fecha Emisión', 'Estado'];
            const rows = resoluciones.map(r => [
              r.nroResolucion,
              r.empresa?.razonSocial.principal || 'Sin empresa',
              r.tipoTramite,
              new Date(r.fechaEmision).toLocaleDateString(),
              r.estado
            ]);
            
            const csvContent = [
              headers.join(','),
              ...rows.map(row => row.join(','))
            ].join('\n');
            
            return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          })
        );
      })
    );
  }

  /**
   * Obtiene estadísticas de resoluciones según los filtros aplicados
   * @param filtros - Filtros para calcular estadísticas
   * @returns Observable con las estadísticas
   */
  getEstadisticasFiltros(filtros: ResolucionFiltros): Observable<EstadisticasResoluciones> {
    console.log('=== getEstadisticasFiltros ===');
    console.log('Filtros:', filtros);

    return this.getResolucionesFiltradas(filtros).pipe(
      map(resoluciones => {
        const estadisticas: EstadisticasResoluciones = {
          total: resoluciones.length,
          porTipo: {},
          porEstado: {},
          porEmpresa: {}
        };

        // Calcular estadísticas por tipo de trámite
        resoluciones.forEach(r => {
          // Por tipo
          if (!estadisticas.porTipo[r.tipoTramite]) {
            estadisticas.porTipo[r.tipoTramite] = 0;
          }
          estadisticas.porTipo[r.tipoTramite]++;

          // Por estado
          if (r.estado) {
            if (!estadisticas.porEstado[r.estado]) {
              estadisticas.porEstado[r.estado] = 0;
            }
            estadisticas.porEstado[r.estado]++;
          }

          // Por empresa
          if (r.empresa) {
            if (!estadisticas.porEmpresa[r.empresaId]) {
              estadisticas.porEmpresa[r.empresaId] = {
                nombre: r.empresa.razonSocial.principal,
                cantidad: 0
              };
            }
            estadisticas.porEmpresa[r.empresaId].cantidad++;
          }
        });

        console.log('Estadísticas calculadas:', estadisticas);
        return estadisticas;
      })
    );
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA DESDE EXCEL
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva de resoluciones
   */
  descargarPlantillaExcel(): Observable<Blob> {
    const url = `${this.apiUrl}/resoluciones/carga-masiva/plantilla`;
    
    return this.http.get(url, { 
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error descargando plantilla de resoluciones:', error);
        return throwError(() => new Error('Error al descargar la plantilla'));
      })
    );
  }

  /**
   * Validar archivo Excel de resoluciones sin procesarlo
   */
  validarArchivoExcel(archivo: File): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/carga-masiva/validar`;
    const formData = new FormData();
    formData.append('archivo', archivo);

    // Headers sin Content-Type para FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error validando archivo de resoluciones:', error);
        return throwError(() => new Error('Error al validar el archivo'));
      })
    );
  }

  /**
   * Procesar carga masiva de resoluciones desde Excel
   */
  procesarCargaMasiva(archivo: File, soloValidar: boolean = false): Observable<any> {
    const url = `${this.apiUrl}/resoluciones/carga-masiva/procesar`;
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    // Agregar parámetro de solo validar
    const params = new URLSearchParams();
    if (soloValidar) {
      params.append('solo_validar', 'true');
    }

    // Headers sin Content-Type para FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

    return this.http.post(finalUrl, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error procesando carga masiva de resoluciones:', error);
        return throwError(() => new Error('Error al procesar el archivo'));
      })
    );
  }
} 
