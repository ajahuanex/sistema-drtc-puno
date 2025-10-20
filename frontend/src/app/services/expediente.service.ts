import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Expediente, ExpedienteCreate, ExpedienteUpdate, ExpedienteSincronizacion, RespuestaSincronizacion, SistemaOrigen, EstadoSincronizacion, ValidacionExpediente, RespuestaValidacion, TipoSolicitante, TipoExpediente } from '../models/expediente.model';

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
      tipoTramite: 'PRIMIGENIA',
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '1',
      descripcion: 'Solicitud de autorización PRIMIGENIA para operar transporte público de pasajeros en rutas interprovinciales',
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
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '2',
      descripcion: 'Renovación de autorización de transporte público de pasajeros - vencimiento próximo',
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
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '3',
      descripcion: 'Solicitud de INCREMENTO de flota vehicular para ampliar cobertura de rutas autorizadas',
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
      tipoTramite: 'PRIMIGENIA',
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '4',
      descripcion: 'Solicitud de autorización PRIMIGENIA para empresa de transporte de carga pesada',
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
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '5',
      descripcion: 'Renovación de autorización para empresa de transporte de carga pesada - ampliación de vigencia',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Renovación año 2026',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '6',
      nroExpediente: 'E-0003-2026',
      folio: 25,
      fechaEmision: new Date('2026-02-15'),
      tipoTramite: 'INCREMENTO',
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '2',
      descripcion: 'Solicitud de INCREMENTO de flota vehicular para ampliar capacidad de transporte de carga',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Incremento año 2026',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '7',
      nroExpediente: 'E-0004-2026',
      folio: 20,
      fechaEmision: new Date('2026-03-10'),
      tipoTramite: 'SUSTITUCION',
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '3',
      descripcion: 'Solicitud de SUSTITUCIÓN de vehículos en flota existente por unidades más modernas y eficientes',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Sustitución año 2026',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '8',
      nroExpediente: 'E-0005-2026',
      folio: 15,
      fechaEmision: new Date('2026-04-01'),
      tipoTramite: 'OTROS',
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '1',
      descripcion: 'Solicitud de modificación de rutas autorizadas para optimizar cobertura geográfica',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Modificación año 2026',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '9',
      nroExpediente: 'E-0001-2027',
      folio: 30,
      fechaEmision: new Date('2027-01-20'),
      tipoTramite: 'PRIMIGENIA',
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '6',
      descripcion: 'Solicitud de autorización PRIMIGENIA para empresa de transporte turístico especializado',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Primigenia año 2027',
      sistemaOrigen: SistemaOrigen.INTERNO,
      fechaSincronizacion: new Date(),
      estadoSincronizacion: EstadoSincronizacion.COMPLETADO
    },
    {
      id: '10',
      nroExpediente: 'E-0002-2027',
      folio: 22,
      fechaEmision: new Date('2027-02-15'),
      tipoTramite: 'RENOVACION',
      tipoSolicitante: TipoSolicitante.EMPRESA,
      empresaId: '6',
      descripcion: 'Renovación de autorización para empresa de transporte turístico especializado - mantenimiento de servicios',
      estado: 'EN PROCESO',
      estaActivo: true,
      documentos: [],
      observaciones: 'Renovación año 2027',
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
    
    // Buscar expediente existente, excluyendo el expediente actual si estamos en modo edición
    const expedienteExistente = this.mockExpedientes.find(e => 
      e.nroExpediente === numeroCompleto && 
      (!validacion.expedienteIdExcluir || e.id !== validacion.expedienteIdExcluir)
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
      tipoSolicitante: expediente.tipoSolicitante,
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
      tipoExpediente: dato.tipoExpediente || 'OTROS',
      tipoSolicitante: dato.tipoSolicitante || TipoSolicitante.EMPRESA,
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
      tipoSolicitante: expedienteCreate.tipoSolicitante,
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

  // ========================================
  // MÉTODOS DE CARGA MASIVA DESDE EXCEL
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva de expedientes
   */
  async descargarPlantillaExpedientes(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/carga-masiva/plantilla`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Error al descargar plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_expedientes.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error descargando plantilla:', error);
      
      // Fallback: generar plantilla CSV simple
      const csvContent = `Número Expediente,RUC Empresa,Tipo Trámite,Descripción,Prioridad,Estado,Fecha Ingreso,Fecha Límite,Solicitante Nombre,Solicitante DNI,Solicitante Email,Solicitante Teléfono,Observaciones
EXP007,20123456789,AUTORIZACION_NUEVA,Solicitud de autorización para nueva ruta interprovincial,ALTA,EN_PROCESO,2024-01-15,2024-02-15,JUAN PÉREZ MAMANI,12345678,juan.perez@empresa.com,951234567,Expediente completo con toda la documentación
EXP008,20234567890,RENOVACION,Renovación de autorización de transporte,MEDIA,EN_REVISION,2024-01-20,2024-02-20,MARÍA RODRÍGUEZ LÓPEZ,87654321,maria.rodriguez@empresa.com,987654321,Requiere revisión adicional de documentos`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_expedientes.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  /**
   * Validar archivo Excel de expedientes
   */
  validarArchivoExpedientes(archivo: File): Promise<any> {
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

      xhr.open('POST', `${this.apiUrl}/carga-masiva/validar`);
      xhr.send(formData);
    });
  }

  /**
   * Procesar carga masiva de expedientes
   */
  procesarCargaMasivaExpedientes(archivo: File, soloValidar: boolean = false): Promise<any> {
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

      const url = `${this.apiUrl}/carga-masiva/procesar?solo_validar=${soloValidar}`;
      xhr.open('POST', url);
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
            numero_expediente: 'INVALID',
            errores: [
              'Formato de número de expediente inválido: INVALID (debe ser EXP seguido de números)',
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
        expedientes_creados: [
          {
            numero_expediente: 'EXP010',
            empresa_ruc: '20123456789',
            tipo_tramite: 'AUTORIZACION_NUEVA',
            estado: 'CREADO'
          }
        ],
        errores_creacion: [],
        total_creadas: 1
      },
      mensaje: 'Procesamiento completado: 1 expedientes creados'
    };
  }
} 