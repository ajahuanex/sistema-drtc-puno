export interface SolicitudBaja {
  id: string;
  vehiculoId: string;
  vehiculoPlaca: string;
  empresaId?: string;
  empresaNombre?: string;
  motivo: MotivoBaja;
  descripcion: string;
  fechaSolicitud: string;
  fechaRevision?: string;
  fechaAprobacion?: string;
  estado: EstadoSolicitudBaja;
  solicitadoPor: {
    usuarioId: string;
    nombreUsuario: string;
    email: string;
  };
  revisadoPor?: {
    usuarioId: string;
    nombreUsuario: string;
    email: string;
  };
  aprobadoPor?: {
    usuarioId: string;
    nombreUsuario: string;
    email: string;
  };
  observaciones?: string;
  documentosSoporte?: DocumentoSoporte[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

export enum MotivoBaja {
  ACCIDENTE = 'ACCIDENTE',
  DETERIORO = 'DETERIORO',
  OBSOLESCENCIA = 'OBSOLESCENCIA',
  CAMBIO_FLOTA = 'CAMBIO_FLOTA',
  VENTA = 'VENTA',
  ROBO_HURTO = 'ROBO_HURTO',
  INCUMPLIMIENTO = 'INCUMPLIMIENTO',
  OTROS = 'OTROS'
}

export enum EstadoSolicitudBaja {
  PENDIENTE = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA'
}

export interface DocumentoSoporte {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: number;
  url: string;
  fechaSubida: string;
}

export interface SolicitudBajaCreate {
  vehiculoId: string;
  motivo: MotivoBaja;
  descripcion: string;
  fechaSolicitud: string;
  documentosSoporte?: File[];
}

export interface SolicitudBajaUpdate {
  estado?: EstadoSolicitudBaja;
  observaciones?: string;
  fechaRevision?: string;
  fechaAprobacion?: string;
  revisadoPor?: {
    usuarioId: string;
    nombreUsuario: string;
    email: string;
  };
  aprobadoPor?: {
    usuarioId: string;
    nombreUsuario: string;
    email: string;
  };
}

export interface SolicitudBajaFilter {
  estado?: EstadoSolicitudBaja[];
  motivo?: MotivoBaja[];
  fechaDesde?: string;
  fechaHasta?: string;
  empresaId?: string;
  vehiculoPlaca?: string;
  solicitadoPor?: string;
}

export const MOTIVOS_BAJA_LABELS: Record<MotivoBaja, string> = {
  [MotivoBaja.ACCIDENTE]: 'Accidente Total',
  [MotivoBaja.DETERIORO]: 'Deterioro por Uso',
  [MotivoBaja.OBSOLESCENCIA]: 'Obsolescencia Tecnológica',
  [MotivoBaja.CAMBIO_FLOTA]: 'Cambio de Flota',
  [MotivoBaja.VENTA]: 'Venta del Vehículo',
  [MotivoBaja.ROBO_HURTO]: 'Robo o Hurto',
  [MotivoBaja.INCUMPLIMIENTO]: 'Incumplimiento Normativo',
  [MotivoBaja.OTROS]: 'Otros'
};

export const ESTADOS_SOLICITUD_LABELS: Record<EstadoSolicitudBaja, string> = {
  [EstadoSolicitudBaja.PENDIENTE]: 'Pendiente',
  [EstadoSolicitudBaja.EN_REVISION]: 'En Revisión',
  [EstadoSolicitudBaja.APROBADA]: 'Aprobada',
  [EstadoSolicitudBaja.RECHAZADA]: 'Rechazada',
  [EstadoSolicitudBaja.CANCELADA]: 'Cancelada'
};