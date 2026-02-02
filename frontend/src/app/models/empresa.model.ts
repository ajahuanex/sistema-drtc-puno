export interface RazonSocial {
  principal: string;
  sunat?: string;
  minimo?: string;
}

export interface RepresentanteLegal {
  dni: string;
  nombres: string;
}

export enum EstadoEmpresa {
  AUTORIZADO = 'AUTORIZADO',
  SUSPENDIDO = 'SUSPENDIDO', 
  CANCELADO = 'CANCELADO',
  EN_TRAMITE = 'EN_TRAMITE'
}

export enum TipoEmpresa {
  PERSONAS = 'P',
  REGIONAL = 'R',
  TURISMO = 'T'
}

export enum TipoServicio {
  PERSONAS = 'PERSONAS',
  TURISMO = 'TURISMO',
  TRABAJADORES = 'TRABAJADORES',
  MERCANCIAS = 'MERCANCIAS',
  ESTUDIANTES = 'ESTUDIANTES',
  TERMINAL_TERRESTRE = 'TERMINAL_TERRESTRE',
  ESTACION_DE_RUTA = 'ESTACION_DE_RUTA',
  OTROS = 'OTROS'
}

export enum TipoEventoEmpresa {
  // Cambios de datos básicos
  CAMBIO_REPRESENTANTE_LEGAL = 'CAMBIO_REPRESENTANTE_LEGAL',
  ACTUALIZACION_DATOS_REPRESENTANTE = 'ACTUALIZACION_DATOS_REPRESENTANTE',
  CAMBIO_RAZON_SOCIAL = 'CAMBIO_RAZON_SOCIAL',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  
  // Operaciones vehiculares
  RENOVACION = 'RENOVACION',
  INCREMENTO = 'INCREMENTO',
  SUSTITUCION = 'SUSTITUCION',
  DUPLICADO = 'DUPLICADO',
  BAJA_VEHICULAR = 'BAJA_VEHICULAR',
  
  // Operaciones de rutas
  CAMBIO_RUTAS = 'CAMBIO_RUTAS',
  CANCELACION_RUTAS = 'CANCELACION_RUTAS',
  AUTORIZACION_RUTAS = 'AUTORIZACION_RUTAS',
  
  // Otros eventos
  CREACION_EMPRESA = 'CREACION_EMPRESA',
  ACTUALIZACION_DATOS_GENERALES = 'ACTUALIZACION_DATOS_GENERALES'
}

export interface EventoHistorialEmpresa {
  id?: string;
  fechaEvento: Date;
  usuarioId: string;
  tipoEvento: TipoEventoEmpresa;
  titulo: string;
  descripcion: string;
  datosAnterior?: any;
  datosNuevo?: any;
  requiereDocumento: boolean;
  // Documentación simplificada para documentos digitales
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  motivo?: string;
  observaciones?: string;
  vehiculoId?: string;
  rutaId?: string;
  resolucionId?: string;
  ipUsuario?: string;
  userAgent?: string;
}

export interface HistorialEmpresa {
  empresaId: string;
  eventos: EventoHistorialEmpresa[];
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  totalEventos: number;
}

export interface EmpresaOperacionVehicular {
  tipoOperacion: TipoEventoEmpresa;
  vehiculoId?: string;
  vehiculosIds?: string[];
  motivo: string;
  // Documentación simplificada
  tipoDocumentoSustentatorio: TipoDocumento;
  numeroDocumentoSustentatorio: string;
  esDocumentoFisico?: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
  datosAdicionales?: any;
}

export interface EmpresaOperacionRutas {
  tipoOperacion: TipoEventoEmpresa;
  rutaId?: string;
  rutasIds?: string[];
  motivo: string;
  // Documentación simplificada (opcional para algunos tipos)
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico?: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
  datosAdicionales?: any;
}

export enum TipoCambioRepresentante {
  CAMBIO_REPRESENTANTE = 'CAMBIO_REPRESENTANTE',
  ACTUALIZACION_DATOS = 'ACTUALIZACION_DATOS'
}

export interface CambioRepresentanteLegal {
  fechaCambio: Date;
  usuarioId: string;
  tipoCambio: TipoCambioRepresentante;
  representanteAnterior: RepresentanteLegal;
  representanteNuevo: RepresentanteLegal;
  motivo: string;
  // Documentación simplificada
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
}

export interface EmpresaCambioRepresentante {
  tipoCambio: TipoCambioRepresentante;
  representanteNuevo: RepresentanteLegal;
  motivo: string;
  // Documentación simplificada
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico?: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
}

export interface CambioEstadoEmpresa {
  fechaCambio: Date;
  usuarioId: string;
  estadoAnterior: EstadoEmpresa;
  estadoNuevo: EstadoEmpresa;
  motivo: string;
  // Documentación simplificada
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
}

export interface EmpresaCambioEstado {
  estadoNuevo: EstadoEmpresa;
  motivo: string;
  // Documentación simplificada
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico?: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
}

export interface Empresa {
  id: string;
  codigoEmpresa: string;
  ruc: string;
  razonSocial: {
    principal: string;
    sunat?: string;
    minimo?: string;
  };
  direccionFiscal: string;
  estado: EstadoEmpresa;
  tiposServicio: TipoServicio[]; // ARRAY: Una empresa puede tener múltiples tipos de servicio
  estaActivo: boolean;
  fechaRegistro: Date;
  fechaActualizacion?: Date;
  representanteLegal: {
    dni: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  // Propiedades de compatibilidad
  direccion?: string;
  telefono?: string;
  email?: string;
  documentos: DocumentoEmpresa[];
  auditoria: AuditoriaEmpresa[];
  historialEventos: EventoHistorialEmpresa[];
  historialEstados: CambioEstadoEmpresa[];
  historialRepresentantes: CambioRepresentanteLegal[];
  resolucionesPrimigeniasIds: string[];
  vehiculosHabilitadosIds: string[];
  conductoresHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
  datosSunat?: DatosSunat;
  ultimaValidacionSunat?: Date;
  scoreRiesgo?: number;
  observaciones?: string;
}

export enum TipoDocumento {
  RUC = 'RUC',
  DNI = 'DNI',
  LICENCIA_CONDUCIR = 'LICENCIA_CONDUCIR',
  CERTIFICADO_VEHICULAR = 'CERTIFICADO_VEHICULAR',
  RESOLUCION = 'RESOLUCION',
  TUC = 'TUC',
  OTRO = 'OTRO'
}

export interface DocumentoEmpresa {
  tipo: TipoDocumento;
  numero: string;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  urlDocumento?: string;
  observaciones?: string;
  estaActivo: boolean;
}

export interface AuditoriaEmpresa {
  fechaCambio: Date;
  usuarioId: string;
  tipoCambio: string;
  campoAnterior?: string;
  campoNuevo?: string;
  observaciones?: string;
}

export interface DatosSunat {
  valido: boolean;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  fechaActualizacion?: Date;
  error?: string;
}

export interface EmpresaCreate {
  codigoEmpresa?: string; // Opcional, se puede generar automáticamente
  ruc: string;
  razonSocial: {
    principal: string;
    sunat?: string;
    minimo?: string;
  };
  direccionFiscal: string;
  representanteLegal: {
    dni: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
  tiposServicio: TipoServicio[]; // ARRAY: Una empresa puede ofrecer múltiples servicios
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos?: DocumentoEmpresa[];
}

export interface EmpresaUpdate {
  ruc?: string;
  razonSocial?: {
    principal: string;
    sunat?: string;
    minimo?: string;
  };
  direccionFiscal?: string;
  representanteLegal?: {
    dni: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
  estado?: EstadoEmpresa;
  tiposServicio?: TipoServicio[]; // ARRAY: Actualizar múltiples tipos de servicio
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos?: DocumentoEmpresa[];
  observaciones?: string;
}

export interface EmpresaFiltros {
  ruc?: string;
  razonSocial?: string;
  estado?: EstadoEmpresa;
  fechaDesde?: Date;
  fechaHasta?: Date;
  scoreRiesgoMin?: number;
  scoreRiesgoMax?: number;
  tieneDocumentosVencidos?: boolean;
  tieneVehiculos?: boolean;
  tieneConductores?: boolean;
}

export interface EmpresaEstadisticas {
  totalEmpresas: number;
  empresasAutorizadas: number;
  empresasHabilitadas?: number; // Mantener para compatibilidad
  empresasEnTramite: number;
  empresasSuspendidas: number;
  empresasCanceladas: number;
  empresasDadasDeBaja: number;
  empresasConDocumentosVencidos: number;
  empresasConScoreAltoRiesgo: number;
  promedioVehiculosPorEmpresa: number;
  promedioConductoresPorEmpresa: number;
}

export interface EmpresaResponse {
  id: string;
  ruc: string;
  razonSocial: {
    principal: string;
    sunat?: string;
    minimo?: string;
  };
  direccionFiscal: string;
  estado: EstadoEmpresa;
  tiposServicio: TipoServicio[]; // ARRAY: Múltiples tipos de servicio
  estaActivo: boolean;
  fechaRegistro: Date;
  fechaActualizacion?: Date;
  representanteLegal: {
    dni: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos: DocumentoEmpresa[];
  auditoria: AuditoriaEmpresa[];
  historialEventos: EventoHistorialEmpresa[];
  historialEstados: CambioEstadoEmpresa[];
  historialRepresentantes: CambioRepresentanteLegal[];
  resolucionesPrimigeniasIds: string[];
  vehiculosHabilitadosIds: string[];
  conductoresHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
  datosSunat?: DatosSunat;
  ultimaValidacionSunat?: Date;
  scoreRiesgo?: number;
  observaciones?: string;
}

// Interfaces para validación SUNAT
export interface ValidacionSunat {
  ruc: string;
  valido: boolean;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  fechaConsulta: Date;
  error?: string;
}

export interface ValidacionDni {
  dni: string;
  valido: boolean;
  nombres?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  estado?: string;
  fechaConsulta: Date;
  error?: string;
}

// Interfaces para reportes
export interface EmpresaReporte {
  empresa: Empresa;
  documentosVencidos: DocumentoEmpresa[];
  scoreRiesgo: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  recomendaciones: string[];
}

export interface EmpresaResumen {
  id: string;
  ruc: string;
  razonSocial: string;
  estado: EstadoEmpresa;
  scoreRiesgo: number;
  vehiculosCount: number;
  conductoresCount: number;
  documentosVencidosCount: number;
  ultimaActualizacion: Date;
} 