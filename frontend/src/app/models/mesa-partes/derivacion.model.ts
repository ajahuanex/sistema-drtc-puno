// Enums
export enum EstadoDerivacion {
  PENDIENTE = 'PENDIENTE',
  RECIBIDO = 'RECIBIDO',
  ATENDIDO = 'ATENDIDO'
}

// Interfaces
export interface Area {
  id: string;
  nombre: string;
  codigo?: string;
}

export interface UsuarioDerivacion {
  id: string;
  nombres: string;
  apellidos: string;
  email?: string;
}

export interface Derivacion {
  id: string;
  documentoId: string;
  areaOrigen: Area;
  areaDestino: Area;
  usuarioDeriva: UsuarioDerivacion;
  usuarioRecibe?: UsuarioDerivacion;
  instrucciones: string;
  fechaDerivacion: Date;
  fechaRecepcion?: Date;
  fechaAtencion?: Date;
  estado: EstadoDerivacion;
  observaciones?: string;
  esUrgente: boolean;
}

export interface DerivacionCreate {
  documentoId: string;
  areaDestinoId: string;
  instrucciones: string;
  esUrgente?: boolean;
  fechaLimite?: Date;
}

export interface DerivacionUpdate {
  estado?: EstadoDerivacion;
  observaciones?: string;
  fechaRecepcion?: Date;
  fechaAtencion?: Date;
}

export interface HistorialDerivacion {
  derivaciones: Derivacion[];
  documentoId: string;
  estadoActual: EstadoDerivacion;
  areaActual: Area;
  totalDerivaciones: number;
}

export interface DerivacionMultiple {
  documentoId: string;
  areasDestinoIds: string[];
  instrucciones: string;
  esUrgente?: boolean;
  fechaLimite?: Date;
}
