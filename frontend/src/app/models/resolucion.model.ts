export type EstadoResolucion = 'VIGENTE' | 'VENCIDA' | 'SUSPENDIDA' | 'REVOCADA' | 'DADA_DE_BAJA';

export type TipoResolucion = 'PADRE' | 'HIJO';

export type TipoTramite = 'PRIMIGENIA' | 'RENOVACION' | 'INCREMENTO' | 'SUSTITUCION' | 'OTROS';

export type TipoResolucionSimple = 'PRIMIGENIA' | 'AMPLIACION' | 'MODIFICACION';

export interface Resolucion {
  id: string;
  nroResolucion: string; // Formato: R-1234-2025 (según el brief)
  empresaId: string;
  expedienteId: string; // ID del expediente que determina el tipo de trámite
  fechaEmision: Date;
  fechaVigenciaInicio?: Date; // Opcional: solo para PADRE + (PRIMIGENIA o RENOVACION)
  fechaVigenciaFin?: Date; // Opcional: solo para PADRE + (PRIMIGENIA o RENOVACION)
  tipoResolucion: TipoResolucion; // Se determina automáticamente: PADRE para PRIMIGENIA/RENOVACION, HIJO para otros
  resolucionPadreId?: string;
  resolucionesHijasIds: string[];
  vehiculosHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
  tipoTramite: TipoTramite; // Se obtiene del expediente
  descripcion: string;
  observaciones?: string; // Agregado para compatibilidad con el frontend
  documentoId?: string;
  estaActivo: boolean;
  // Campos adicionales del brief
  estado?: EstadoResolucion;
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
  usuarioEmisionId?: string;
  usuarioAprobacionId?: string;
  fechaAprobacion?: Date;
  motivoSuspension?: string;
  fechaSuspension?: Date;
  fechaVencimiento?: Date; // Para compatibilidad con el frontend
  documentos?: any[]; // Para compatibilidad con el servicio mock
  auditoria?: any[]; // Para compatibilidad con el servicio mock
}

export interface DocumentoResolucion {
  id: string;
  tipo: string;
  nombre: string;
  url: string;
  fechaSubida: Date;
  estaActivo: boolean;
}

export interface AuditoriaResolucion {
  fechaCambio: Date;
  usuarioId: string;
  tipoCambio: string;
  campoAnterior?: string;
  campoNuevo?: string;
  observaciones?: string;
}

export interface ResolucionCreate {
  numero: string; // Solo el número (1234), el sistema generará R-1234-2025
  expedienteId: string; // ID del expediente que determina el tipo de trámite
  fechaEmision: Date;
  fechaVigenciaInicio?: Date;
  fechaVigenciaFin?: Date;
  tipoResolucion: TipoResolucion;
  tipoTramite: TipoTramite;
  empresaId: string;
  descripcion: string;
  observaciones?: string;
  resolucionPadreId?: string;
  vehiculosHabilitadosIds?: string[];
  rutasAutorizadasIds?: string[];
}

export interface ResolucionUpdate {
  numero?: string; // Solo el número (1234)
  fechaEmision?: Date;
  fechaVencimiento?: Date;
  estado?: EstadoResolucion;
  tipo?: TipoResolucionSimple;
  empresaId?: string;
  vehiculoId?: string;
  rutaId?: string;
  conductorId?: string;
  descripcion?: string;
  observaciones?: string;
  estaActivo?: boolean;
  resolucionPadreId?: string;
}

export interface ResolucionFiltros {
  numero?: string;
  empresaId?: string;
  vehiculoId?: string;
  rutaId?: string;
  conductorId?: string;
  estado?: EstadoResolucion;
  tipo?: TipoResolucionSimple;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estaActivo?: boolean;
}

export interface ResolucionEstadisticas {
  totalResoluciones: number;
  resolucionesVigentes: number;
  resolucionesVencidas: number;
  resolucionesSuspendidas: number;
  resolucionesCanceladas: number;
  resolucionesPrimigenias: number;
  resolucionesAmpliacion: number;
  resolucionesModificacion: number;
  proximasAVencer: number;
} 