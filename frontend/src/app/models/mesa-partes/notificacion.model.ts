// Enums
export enum TipoNotificacion {
  DOCUMENTO_DERIVADO = 'DOCUMENTO_DERIVADO',
  DOCUMENTO_RECIBIDO = 'DOCUMENTO_RECIBIDO',
  DOCUMENTO_URGENTE = 'DOCUMENTO_URGENTE',
  DOCUMENTO_PROXIMO_VENCER = 'DOCUMENTO_PROXIMO_VENCER',
  DOCUMENTO_VENCIDO = 'DOCUMENTO_VENCIDO',
  DOCUMENTO_ATENDIDO = 'DOCUMENTO_ATENDIDO',
  DOCUMENTO_ARCHIVADO = 'DOCUMENTO_ARCHIVADO',
  INTEGRACION_ERROR = 'INTEGRACION_ERROR',
  SISTEMA = 'SISTEMA'
}

export enum PrioridadNotificacion {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE'
}

// Interfaces
export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
  leida: boolean;
  documentoId?: string;
  derivacionId?: string;
  integracionId?: string;
  url?: string;
  metadatos?: Record<string, any>;
  fechaCreacion: Date;
  fechaLeida?: Date;
}

export interface NotificacionCreate {
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad?: PrioridadNotificacion;
  documentoId?: string;
  derivacionId?: string;
  integracionId?: string;
  url?: string;
  metadatos?: Record<string, any>;
}

export interface PreferenciasNotificacion {
  usuarioId: string;
  notificacionesEmail: boolean;
  notificacionesSistema: boolean;
  notificacionesPush: boolean;
  tiposHabilitados: TipoNotificacion[];
  horariosNoMolestar?: {
    inicio: string; // HH:mm
    fin: string; // HH:mm
  };
}

export interface EventoNotificacion {
  tipo: TipoNotificacion;
  datos: any;
  timestamp: Date;
}
