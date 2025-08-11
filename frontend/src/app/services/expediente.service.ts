import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Expediente, ExpedienteCreate, ExpedienteUpdate, ExpedienteSincronizacion, RespuestaSincronizacion, SistemaOrigen, EstadoSincronizacion, ValidacionExpediente, RespuestaValidacion } from '../models/expediente.model';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v1/expedientes';

  // Datos mock para desarrollo
  private mockExpedientes: Expediente[] = [
    {
      id: '1',
      nroExpediente: 'E-0001-2025',
      folio: 15, // Cantidad de hojas del expediente
      fechaEmision: new Date('2025-01-15'),
      tipoTramite: 'AUTORIZACION NUEVA',
      empresaId: '1',
      descripcion: 'Solicitud de autorización para operar transporte público',
      estado: 'APROBADO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Expediente aprobado para nueva empresa',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '2',
      nroExpediente: 'E-0002-2025',
      folio: 8, // Cantidad de hojas del expediente
      fechaEmision: new Date('2025-01-20'),
      tipoTramite: 'RENOVACION',
      empresaId: '2',
      descripcion: 'Renovación de autorización de transporte',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'En proceso de revisión',
      sistemaOrigen: SistemaOrigen.SISTEMA_GESTION_DOCUMENTARIA,
      idExterno: 'EXT-001',
      codigoExterno: 'GD-2025-001',
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO,
      metadatosExternos: {
        sistema: 'Sistema de Gestión Documentaria',
        modulo: 'Tramites',
        usuarioCreacion: 'admin@gestion.com',
        departamento: 'Transportes'
      }
    },
    {
      id: '3',
      nroExpediente: 'E-0003-2025',
      folio: 22, // Cantidad de hojas del expediente
      fechaEmision: new Date('2025-01-25'),
      tipoTramite: 'INCREMENTO',
      empresaId: '3',
      descripcion: 'Solicitud de incremento de flota vehicular',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Pendiente de documentación adicional',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '4',
      nroExpediente: 'E-0001-2026', // Mismo número (0001) pero año diferente (2026)
      folio: 12,
      fechaEmision: new Date('2026-01-10'),
      tipoTramite: 'AUTORIZACION NUEVA',
      empresaId: '4',
      descripcion: 'Nueva autorización para empresa del 2026',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Expediente del año 2026',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '5',
      nroExpediente: 'E-0002-2026', // Mismo número (0002) pero año diferente (2026)
      folio: 18,
      fechaEmision: new Date('2026-01-15'),
      tipoTramite: 'RENOVACION',
      empresaId: '5',
      descripcion: 'Renovación para empresa del 2026',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Renovación año 2026',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    }
  ];

  getExpedientes(): Observable<Expediente[]> {
    // Por ahora retornamos datos mock
    return of(this.mockExpedientes);
  }

  getExpedienteById(id: string): Observable<Expediente> {
    const expediente = this.mockExpedientes.find(e => e.id === id);
    if (expediente) {
      return of(expediente);
    }
    throw new Error('Expediente no encontrado');
  }

  getExpediente(id: string): Observable<Expediente> {
    const expediente = this.mockExpedientes.find(e => e.id === id);
    if (expediente) {
      return of(expediente);
    }
    throw new Error('Expediente no encontrado');
  }

  getExpedienteByNumero(numero: string): Observable<Expediente | null> {
    const expediente = this.mockExpedientes.find(e => e.nroExpediente === numero);
    return of(expediente || null);
  }

  getExpedienteByFolio(folio: number): Observable<Expediente | null> {
    const expediente = this.mockExpedientes.find(e => e.folio === folio);
    return of(expediente || null);
  }

  validarExpedienteUnico(validacion: ValidacionExpediente): Observable<RespuestaValidacion> {
    // Validar número de expediente único POR AÑO (E-1234-2025 y E-1234-2026 son diferentes)
    const numeroCompleto = `E-${validacion.numero.padStart(4, '0')}-${validacion.fechaEmision.getFullYear()}`;
    const expedienteExistente = this.mockExpedientes.find(e => 
      e.nroExpediente === numeroCompleto
    );

    if (expedienteExistente) {
      const respuesta: RespuestaValidacion = {
        valido: false,
        mensaje: `Ya existe un expediente con el número ${numeroCompleto} en el año ${validacion.fechaEmision.getFullYear()}`,
        expedienteExistente: {
          id: expedienteExistente.id,
          nroExpediente: expedienteExistente.nroExpediente,
          folio: expedienteExistente.folio,
          empresaId: expedienteExistente.empresaId,
          estado: expedienteExistente.estado
        },
        conflictos: [`Número de expediente duplicado en el año ${validacion.fechaEmision.getFullYear()}`]
      };
      return of(respuesta);
    }

    return of({
      valido: true,
      mensaje: `Expediente válido - Número ${numeroCompleto} disponible para el año ${validacion.fechaEmision.getFullYear()}`
    });
  }

  createExpediente(expediente: ExpedienteCreate): Observable<Expediente> {
    // Generar el número completo del expediente (E-0123-2025)
    const año = expediente.fechaEmision.getFullYear();
    const numeroFormateado = expediente.numero.padStart(4, '0');
    const nroExpediente = `E-${numeroFormateado}-${año}`;
    
    const newExpediente: Expediente = {
      id: (this.mockExpedientes.length + 1).toString(),
      nroExpediente: nroExpediente,
      folio: expediente.folio,
      fechaEmision: expediente.fechaEmision,
      tipoTramite: expediente.tipoTramite,
      empresaId: expediente.empresaId,
      descripcion: expediente.descripcion,
      observaciones: expediente.observaciones,
      fechaRegistro: new Date(),
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      sistemaOrigen: expediente.sistemaOrigen,
      idExterno: expediente.idExterno,
      codigoExterno: expediente.codigoExterno,
      metadatosExternos: expediente.metadatosExternos,
      urlExterna: expediente.urlExterna,
      prioridad: expediente.prioridad,
      categoria: expediente.categoria,
      tags: expediente.tags,
      costo: expediente.costo,
      moneda: expediente.moneda,
      plazos: expediente.plazos,
      impacto: expediente.impacto,
      riesgo: expediente.riesgo,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO,
      hashVerificacion: this.generarHash({ ...expediente, nroExpediente }),
      versionDatos: '1.0'
    };
    
    this.mockExpedientes.push(newExpediente);
    return of(newExpediente);
  }

  updateExpediente(id: string, expediente: ExpedienteUpdate): Observable<Expediente> {
    const index = this.mockExpedientes.findIndex(e => e.id === id);
    if (index !== -1) {
      // Si se está actualizando el número, generar el formato completo
      let nroExpediente = this.mockExpedientes[index].nroExpediente;
      if (expediente.nroExpediente) {
        const año = expediente.fechaEmision ? expediente.fechaEmision.getFullYear() : new Date().getFullYear();
        const numeroFormateado = expediente.nroExpediente.padStart(4, '0');
        nroExpediente = `E-${numeroFormateado}-${año}`;
      }
      
      this.mockExpedientes[index] = {
        ...this.mockExpedientes[index],
        ...expediente,
        nroExpediente: nroExpediente,
        fechaActualizacion: new Date()
      };
      return of(this.mockExpedientes[index]);
    }
    throw new Error('Expediente no encontrado');
  }

  deleteExpediente(id: string): Observable<void> {
    const index = this.mockExpedientes.findIndex(e => e.id === id);
    if (index !== -1) {
      this.mockExpedientes.splice(index, 1);
      return of(void 0);
    }
    throw new Error('Expediente no encontrado');
  }

  // Método para obtener expedientes por empresa
  getExpedientesByEmpresa(empresaId: string): Observable<Expediente[]> {
    const expedientes = this.mockExpedientes.filter(e => e.empresaId === empresaId);
    return of(expedientes);
  }

  // Método para obtener expedientes por tipo de trámite
  getExpedientesByTipoTramite(tipoTramite: string): Observable<Expediente[]> {
    const expedientes = this.mockExpedientes.filter(e => e.tipoTramite === tipoTramite);
    return of(expedientes);
  }

  // Métodos para sincronización con sistemas externos
  sincronizarExpedienteExterno(datosSincronizacion: ExpedienteSincronizacion): Observable<RespuestaSincronizacion> {
    // Simular sincronización con sistema externo
    return of({
      exitosa: true,
      mensaje: 'Expediente sincronizado exitosamente',
      expedienteId: this.generarIdUnico(),
      fechaProcesamiento: new Date()
    }).pipe(
      tap(() => {
        // Actualizar estado de sincronización local
        this.actualizarEstadoSincronizacion(datosSincronizacion.idExterno, EstadoSincronizacion.COMPLETADO);
      }),
      catchError(error => {
        this.actualizarEstadoSincronizacion(datosSincronizacion.idExterno, EstadoSincronizacion.ERROR);
        return throwError(() => new Error('Error en sincronización'));
      })
    );
  }

  importarExpedientesExternos(sistemaOrigen: SistemaOrigen, datos: any[]): Observable<RespuestaSincronizacion> {
    const expedientesImportados: string[] = [];
    const conflictos: string[] = [];
    
    datos.forEach(dato => {
      try {
        // Validar datos del expediente externo
        if (this.validarDatosExternos(dato)) {
          const expediente = this.convertirDatosExternos(dato, sistemaOrigen);
          const expedienteCreado = this.crearExpedienteDesdeExterno(expediente);
          expedientesImportados.push(expedienteCreado.id);
        } else {
          conflictos.push(`Datos inválidos para expediente: ${dato.id || 'ID no especificado'}`);
        }
      } catch (error) {
        conflictos.push(`Error procesando expediente: ${error}`);
      }
    });

    return of({
      exitosa: conflictos.length === 0,
      mensaje: `Importación completada. ${expedientesImportados.length} expedientes importados, ${conflictos.length} conflictos.`,
      expedienteId: expedientesImportados[0], // Primer expediente importado
      conflictos,
      fechaProcesamiento: new Date()
    });
  }

  exportarExpedientesParaSincronizacion(ids: string[], sistemaDestino: SistemaOrigen): Observable<any[]> {
    const expedientes = this.mockExpedientes.filter(e => ids.includes(e.id));
    
    return of(expedientes.map(expediente => ({
      id: expediente.id,
      nroExpediente: expediente.nroExpediente,
      fechaEmision: expediente.fechaEmision,
      tipoTramite: expediente.tipoTramite,
      estado: expediente.estado,
      empresaId: expediente.empresaId,
      descripcion: expediente.descripcion,
      observaciones: expediente.observaciones,
      sistemaOrigen: expediente.sistemaOrigen,
      fechaSincronizacion: new Date(),
      hashVerificacion: this.generarHash(expediente),
      versionDatos: '1.0'
    })));
  }

  verificarIntegridadExpediente(id: string): Observable<{ valido: boolean; hash: string; hashCalculado: string }> {
    const expediente = this.mockExpedientes.find(e => e.id === id);
    if (!expediente) {
      return throwError(() => new Error('Expediente no encontrado'));
    }

    const hashCalculado = this.generarHash(expediente);
    const valido = expediente.hashVerificacion === hashCalculado;

    return of({
      valido,
      hash: expediente.hashVerificacion || '',
      hashCalculado
    });
  }

  resolverConflictosSincronizacion(idExterno: string, resolucion: any): Observable<RespuestaSincronizacion> {
    // Simular resolución de conflictos
    return of({
      exitosa: true,
      mensaje: 'Conflictos resueltos exitosamente',
      fechaProcesamiento: new Date()
    });
  }

  obtenerEstadisticasSincronizacion(): Observable<{
    totalExpedientes: number;
    expedientesSincronizados: number;
    expedientesPendientes: number;
    expedientesConError: number;
    ultimaSincronizacion: Date;
  }> {
    const total = this.mockExpedientes.length;
    const sincronizados = this.mockExpedientes.filter(e => e.estadoSincronizacion === EstadoSincronizacion.COMPLETADO).length;
    const pendientes = this.mockExpedientes.filter(e => e.estadoSincronizacion === EstadoSincronizacion.PENDIENTE).length;
    const conError = this.mockExpedientes.filter(e => e.estadoSincronizacion === EstadoSincronizacion.ERROR).length;

    return of({
      totalExpedientes: total,
      expedientesSincronizados: sincronizados,
      expedientesPendientes: pendientes,
      expedientesConError: conError,
      ultimaSincronizacion: new Date()
    });
  }

  // Métodos auxiliares privados
  private validarDatosExternos(dato: any): boolean {
    // Validar campos mínimos requeridos
    return dato && 
           dato.nroExpediente && 
           dato.fechaEmision && 
           dato.tipoTramite;
  }

  private convertirDatosExternos(dato: any, sistemaOrigen: SistemaOrigen): ExpedienteCreate {
    return {
      numero: this.extraerNumeroExpediente(dato.nroExpediente),
      folio: dato.folio || Math.floor(Math.random() * 50) + 1, // Generar folio numérico aleatorio (1-50 hojas) si no existe
      fechaEmision: new Date(dato.fechaEmision),
      tipoTramite: dato.tipoTramite,
      empresaId: dato.empresaId,
      descripcion: dato.descripcion,
      observaciones: dato.observaciones,
      sistemaOrigen,
      idExterno: dato.id,
      codigoExterno: dato.codigoExterno,
      metadatosExternos: dato.metadatosExternos,
      urlExterna: dato.urlExterna,
      prioridad: dato.prioridad,
      categoria: dato.categoria,
      tags: dato.tags,
      costo: dato.costo,
      moneda: dato.moneda,
      plazos: dato.plazos,
      impacto: dato.impacto,
      riesgo: dato.riesgo
    };
  }

  private extraerNumeroExpediente(nroExpediente: string): string {
    // Extraer solo el número del formato E-1234-2025
    const match = nroExpediente.match(/^E-(\d{4})-\d{4}$/);
    return match ? match[1] : nroExpediente;
  }

  private crearExpedienteDesdeExterno(expedienteCreate: ExpedienteCreate): Expediente {
    const numeroFormateado = expedienteCreate.numero.padStart(4, '0');
    const año = expedienteCreate.fechaEmision.getFullYear();
    const nroExpediente = `E-${numeroFormateado}-${año}`;

    const nuevoExpediente: Expediente = {
      id: this.generarIdUnico(),
      nroExpediente,
      folio: expedienteCreate.folio,
      fechaEmision: expedienteCreate.fechaEmision,
      tipoTramite: expedienteCreate.tipoTramite,
      empresaId: expedienteCreate.empresaId,
      descripcion: expedienteCreate.descripcion,
      observaciones: expedienteCreate.observaciones,
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      fechaRegistro: new Date(),
      sistemaOrigen: expedienteCreate.sistemaOrigen,
      idExterno: expedienteCreate.idExterno,
      codigoExterno: expedienteCreate.codigoExterno,
      metadatosExternos: expedienteCreate.metadatosExternos,
      urlExterna: expedienteCreate.urlExterna,
      prioridad: expedienteCreate.prioridad,
      categoria: expedienteCreate.categoria,
      tags: expedienteCreate.tags,
      costo: expedienteCreate.costo,
      moneda: expedienteCreate.moneda,
      plazos: expedienteCreate.plazos,
      impacto: expedienteCreate.impacto,
      riesgo: expedienteCreate.riesgo,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO,
      hashVerificacion: this.generarHash({ ...expedienteCreate, nroExpediente }),
      versionDatos: '1.0'
    };

    this.mockExpedientes.push(nuevoExpediente);
    return nuevoExpediente;
  }

  private actualizarEstadoSincronizacion(idExterno: string, estado: EstadoSincronizacion): void {
    const expediente = this.mockExpedientes.find(e => e.idExterno === idExterno);
    if (expediente) {
      expediente.estadoSincronizacion = estado;
      expediente.fechaSincronizacion = new Date();
    }
  }

  private generarHash(expediente: any): string {
    // Simular generación de hash para verificación de integridad
    const contenido = JSON.stringify(expediente);
    return btoa(contenido).substring(0, 16); // Hash simple para demo
  }

  private generarIdUnico(): string {
    return (this.mockExpedientes.length + 1).toString();
  }
} 