// ========================================
// ENUMS
// ========================================

export enum EstadoEmpresa {
  AUTORIZADA = 'AUTORIZADA',
  EN_TRAMITE = 'EN_TRAMITE',
  SUSPENDIDA = 'SUSPENDIDA',
  CANCELADA = 'CANCELADA'
}

export enum TipoServicio {
  PASAJEROS = 'PASAJEROS',
  TURISMO = 'TURISMO',
  TRABAJADORES = 'TRABAJADORES',
  MERCANCIAS = 'MERCANCIAS',
  CARGA = 'CARGA',
  INFRAESTRUCTURA = 'INFRAESTRUCTURA',
  OTROS = 'OTROS',
  MIXTO = 'MIXTO'
}

export enum TipoSocio {
  REPRESENTANTE_LEGAL = 'REPRESENTANTE_LEGAL',
  GERENTE = 'GERENTE',
  ADMINISTRADOR = 'ADMINISTRADOR',
  SOCIO = 'SOCIO',
  APODERADO = 'APODERADO'
}

export enum TipoEmpresa {
  PERSONAS = 'P',
  REGIONAL = 'R',
  TURISMO = 'T'
}

// ========================================
// MODELOS BASE
// ========================================

export interface RazonSocial {
  principal: string;
  sunat?: string;
  minimo?: string;
}

export interface Socio {
  dni: string;
  nombres: string;
  apellidos: string;
  tipoSocio: TipoSocio;
  email?: string;
  telefono?: string;
  direccion?: string;
}

// ========================================
// MODELO PRINCIPAL
// ========================================

export interface Empresa {
  id: string;
  ruc: string;
  razonSocial: RazonSocial;
  direccionFiscal: string;
  estado: EstadoEmpresa;
  tiposServicio: TipoServicio[];
  estaActivo: boolean;
  fechaRegistro: Date;
  fechaActualizacion?: Date;
  socios: Socio[];
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  observaciones?: string;
}

// ========================================
// OPERACIONES CRUD
// ========================================

export interface EmpresaCreate {
  ruc: string;
  razonSocial: RazonSocial;
  direccionFiscal: string;
  socios: Socio[];
  tiposServicio: TipoServicio[];
  estado?: EstadoEmpresa;
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  observaciones?: string;
}

export interface EmpresaUpdate {
  ruc?: string;
  razonSocial?: RazonSocial;
  direccionFiscal?: string;
  socios?: Socio[];
  estado?: EstadoEmpresa;
  tiposServicio?: TipoServicio[];
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  observaciones?: string;
}

export interface SocioCreate {
  dni: string;
  nombres: string;
  apellidos: string;
  tipoSocio: TipoSocio;
}

export interface SocioUpdate {
  tipoSocio: TipoSocio;
}

// ========================================
// FILTROS Y BÚSQUEDAS
// ========================================

export interface EmpresaFiltros {
  ruc?: string;
  razonSocial?: string;
  estado?: EstadoEmpresa;
  tipoServicio?: TipoServicio;
  fechaRegistroDesde?: Date;
  fechaRegistroHasta?: Date;
  estaActivo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// RESPUESTAS
// ========================================

export interface EmpresaResponse extends Empresa {
  // Usa todos los campos de Empresa
}

export interface EmpresaResumen {
  id: string;
  ruc: string;
  razonSocial: string;
  estado: EstadoEmpresa;
  estaActivo: boolean;
  fechaRegistro: Date;
  socios: Socio[];
}
