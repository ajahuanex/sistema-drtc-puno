export interface RazonSocial {
  principal: string;
  sunat?: string;
  minimo?: string;
}

export interface RepresentanteLegal {
  dni: string;
  nombres: string;
}

export interface Empresa {
  id: string;
  ruc: string;
  razonSocial: {
    principal: string;
    sunat?: string;
    minimo?: string;
  };
  direccionFiscal: string;
  estado: EstadoEmpresa;
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
  resolucionesPrimigeniasIds: string[];
  vehiculosHabilitadosIds: string[];
  conductoresHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
  datosSunat?: DatosSunat;
  ultimaValidacionSunat?: Date;
  scoreRiesgo?: number;
  observaciones?: string;
}

export enum EstadoEmpresa {
  HABILITADA = 'HABILITADA',
  EN_TRAMITE = 'EN_TRAMITE',
  SUSPENDIDA = 'SUSPENDIDA',
  CANCELADA = 'CANCELADA',
  DADA_DE_BAJA = 'DADA_DE_BAJA'
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
  empresasHabilitadas: number;
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