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
  partidaRegistral?: string;
  // Datos SUNAT persistidos
  datosSunat?: SunatData;
  ultimaValidacionSunat?: Date;
}

export interface SunatData {
  ddp_nombre?: string;
  ddp_estado?: string;
  desc_estado?: string;
  esActivo?: boolean;
  esHabido?: boolean;
  fechaConsulta?: string;
  [key: string]: any;
}

// ========================================
// OPERACIONES CRUD
// ========================================

export interface EmpresaCreate {
  ruc: string;
  razonSocial: RazonSocial;
  direccionFiscal: string;
  partidaRegistral?: string;
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
  partidaRegistral?: string;
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

// ========================================
// EXPEDIENTE OPERATIVO Y ESTADÍSTICAS
// ========================================

export interface RutaPrimigeniaItem {
  id: string;
  codigoRuta?: string;
  nombreRuta?: string;
  origen?: string;
  destino?: string;
  itinerario?: string[];
  estado?: string;
  tipoServicio?: string;
}

export interface VehiculoPrimigeniaItem {
  id: string;
  placa: string;
  estado: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  anio_fabricacion?: number;
  nro_tuc?: string;
}

export interface ModificatoriaHijaItem {
  id: string;
  nro_resolucion: string;
  tipo_acto: string;
  tipo_tramite_origen?: string;
  fecha_resolucion?: string;
  vehiculos_ingresantes?: string[];
  vehiculos_salientes?: string[];
  rutas_modificadas_ids?: string[];
  link_documento?: string;
  observaciones?: string;
}

export interface PrimigeniaDetalleItem {
  id?: string;
  nro_resolucion: string;
  siglas?: string;
  estado: string;
  tipo_autorizacion: string;
  anios_vigencia?: number;
  fecha_resolucion?: string;
  fecha_inicio_vigencia?: string;
  fecha_fin_vigencia?: string;
  link_documento?: string;
  observaciones?: string;
  es_detectada: boolean;
  rutas: RutaPrimigeniaItem[];
  flota: VehiculoPrimigeniaItem[];
  modificatorias: ModificatoriaHijaItem[];
}

export interface KpisExpedienteEmpresa {
  total_primigenias: number;
  total_rutas: number;
  total_vehiculos_habilitados: number;
  total_modificatorias: number;
}

export interface ExpedienteOperativoEmpresa {
  kpis: KpisExpedienteEmpresa;
  primigenias: PrimigeniaDetalleItem[];
}
