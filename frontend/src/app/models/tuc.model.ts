export type TipoEmisionTuc = 'ELECTRONICA' | 'FISICA';

export type EstadoTuc = 
  | 'VIGENTE' 
  | 'ANULADA' 
  | 'SUSPENDIDA' 
  | 'REEMPLAZADA' 
  | 'VENCIDA' 
  | 'ANULADA_POR_DUPLICADO';

export type MotivoEmision = 
  | 'AUTORIZACION_NUEVA'
  | 'RENOVACION'
  | 'INCREMENTO_FLOTA'
  | 'SUSTITUCION_VEHICULAR'
  | 'DUPLICADO_PERDIDA'
  | 'DUPLICADO_DETERIORO'
  | 'CANJE_A_ELECTRONICA'
  | 'HISTORICO_MIGRADO';

export interface Tuc {
  id?: string;
  _id?: string;
  nroTuc: string;
  tipoEmision: TipoEmisionTuc;
  estado: EstadoTuc;
  motivoEmision: MotivoEmision;
  
  placa: string;
  vehiculoId?: string;
  ruc: string;
  razonSocial: string;
  empresaId?: string;
  nroResolucion: string;
  resolucionId?: string;
  tipo_resolucion_hija?: string;
  
  fechaEmision: string;
  fechaVencimiento?: string;
  hashSeguridad?: string;
  qrVerificationUrl?: string;
  
  loteKardexId?: string;
  serieFisica?: string;
  
  datosVehiculo?: Record<string, any>;
  datosEmpresa?: Record<string, any>;
  datosResolucion?: Record<string, any>;
  rutasHabilitadas?: Array<Record<string, any>>;
  
  observaciones?: string;
  tucAnteriorId?: string;
  historialCambios?: Array<{
    fecha: string;
    accion: string;
    usuario: string;
    detalle: string;
  }>;
  fechaRegistro?: string;
  fechaActualizacion?: string;
  [key: string]: any;
}

export interface TucCreateRequest {
  nroTuc?: string;
  tipoEmision: TipoEmisionTuc;
  motivoEmision: MotivoEmision;
  placa: string;
  ruc: string;
  nroResolucion: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  loteKardexId?: string;
  serieFisica?: string;
  observaciones?: string;
  tucAnteriorId?: string;
}

export interface TucDuplicadoRequest {
  tucAnteriorId: string;
  motivo: MotivoEmision;
  tipoEmision: TipoEmisionTuc;
  loteKardexId?: string;
  serieFisica?: string;
  observaciones?: string;
}

export interface TucKardexStock {
  id?: string;
  _id?: string;
  nroLote: string;
  serieInicio: string;
  serieFin: string;
  totalImpresos: number;
  disponibles: number;
  asignados: number;
  anulados: number;
  fechaRecepcion: string;
  registradoPor?: string;
  observaciones?: string;
}

export interface TucVerificacionPublica {
  nroTuc: string;
  tipoEmision: string;
  estado: string;
  esVigente: boolean;
  mensajeEstado: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  hashSeguridad?: string;
  empresa: Record<string, any>;
  vehiculo: Record<string, any>;
  resolucion: Record<string, any>;
  rutas: Array<Record<string, any>>;
  observaciones?: string;
}

export interface TucEstadisticas {
  totalTucs: number;
  vigentes: number;
  electronicas: number;
  fisicas: number;
  anuladas: number;
  reemplazadas: number;
  stockFisicoDisponible: number;
}