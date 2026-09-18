export type ModuloAuditoria = 
  | 'VEHICULOS' 
  | 'RUTAS' 
  | 'EMPRESAS' 
  | 'RESOLUCIONES' 
  | 'TUCS' 
  | 'INFRAESTRUCTURA' 
  | 'SEGURIDAD';

export type AccionAuditoria = 
  | 'REGISTRO' 
  | 'MODIFICACION' 
  | 'ELIMINACION' 
  | 'SUSTITUCION' 
  | 'INCREMENTO' 
  | 'BAJA_VEHICULAR' 
  | 'CAMBIO_ESTADO' 
  | 'CAMBIO_REPRESENTANTE' 
  | 'ASIGNACION_RUTA' 
  | 'DESASIGNACION_RUTA' 
  | 'EMISION_TUC' 
  | 'ANULACION_TUC' 
  | 'IMPORTACION_MASIVA';

export type SeveridadAuditoria = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';

export interface UsuarioAuditoria {
  id?: string;
  dni?: string;
  nombre?: string;
  email?: string;
  rol?: string;
}

export interface LogAuditoria {
  _id?: string;
  id?: string;
  timestamp: string;
  usuario: UsuarioAuditoria;
  ip_address?: string;
  user_agent?: string;
  modulo: ModuloAuditoria;
  accion: AccionAuditoria;
  severidad: SeveridadAuditoria;
  entidad_tipo: string;
  entidad_id: string;
  entidad_referencia?: string;
  descripcion: string;
  acto_resolutivo_sustento?: string;
  expediente_numero?: string;
  valores_anteriores?: Record<string, any>;
  valores_nuevos?: Record<string, any>;
  campos_modificados?: string[];
  metadatos?: Record<string, any>;
  es_historico_migrado?: boolean;
}

export interface AuditoriaKPIs {
  totalEventos: number;
  eventosUltimas24h: number;
  eventosUltimos7d: number;
  eventosCriticos: number;
  eventosAltos: number;
  porModulo: Record<string, number>;
  porAccion: Record<string, number>;
  porSeveridad: Record<string, number>;
  topUsuarios: Array<{
    dni: string;
    nombre: string;
    email: string;
    rol: string;
    total: number;
  }>;
}

export interface AuditoriaRespuestaPaginada {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: LogAuditoria[];
}

export interface FiltrosAuditoria {
  modulo?: string;
  accion?: string;
  severidad?: string;
  q?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  pageSize?: number;
}
